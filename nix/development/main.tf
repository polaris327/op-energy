variable "DO_TOKEN" {
  type = string
  validation {
    condition = length( var.DO_TOKEN) > 0
    error_message = "DO_TOKEN should not be empty."
  }
}

provider "digitalocean" {
  token = var.DO_TOKEN
}

variable "DO_REGION" {
  type = string
  validation {
    condition = length( var.DO_REGION) > 0
    error_message = "DO_REGION should not be empty."
  }
}
variable "DROPLET_NAME" {
  type = string
  validation {
    condition = length( var.DROPLET_NAME) > 0
    error_message = "DROPLET_NAME should not be empty."
  }
}
variable "SSH_KEYS_IDS" {
  type = list( string)
}

resource "digitalocean_volume" "dev_bitcoind_signet" {
  region                  = var.DO_REGION
  name                    = "${var.DROPLET_NAME}-bitcoind-signet"
  size                    = 1
  initial_filesystem_type = "xfs"
  description             = "volume for blockchain"
}
resource "digitalocean_volume" "dev_electrs_signet" {
  region                  = var.DO_REGION
  name                    = "${var.DROPLET_NAME}-electrs-signet"
  size                    = 1
  initial_filesystem_type = "xfs"
  description             = "volume for index"
}

resource "digitalocean_droplet" "dev_droplet_instance" {
  name   = var.DROPLET_NAME
  size   = "s-1vcpu-2gb"
  image  = "centos-8-x64"
  region = var.DO_REGION
  ssh_keys = var.SSH_KEYS_IDS
  volume_ids = [ digitalocean_volume.dev_bitcoind_signet.id, digitalocean_volume.dev_electrs_signet.id ]
  user_data = <<-EOT
    #cloud-config
          write_files:
          - path: /etc/nixos/host.nix
            permissions: '0644'
            content: |
              {pkgs, lib, ...}:
              let
                # import psk from out-of-git file
                # TODO: switch to secrets-manager and change to make it more secure
                bitcoind-signet-rpc-psk = builtins.readFile ( "/etc/nixos/private/bitcoind-signet-rpc-psk.txt");
                # TODO: refactor to autogenerate HMAC from the password above
                bitcoind-signet-rpc-pskhmac = builtins.readFile ( "/etc/nixos/private/bitcoind-signet-rpc-pskhmac.txt");
                op-energy-db-psk-signet = builtins.readFile ( "/etc/nixos/private/op-energy-db-psk-signet.txt");
              in
              {
                imports = [
                  # custom module for already existing electrs derivation
                  ./overlays/electrs-overlay/module.nix
                  # custom module for op-energy
                  ./overlays/op-energy/nix/module.nix
                ];
                networking.hostName = "${var.DROPLET_NAME}";
                system.stateVersion = "21.05";
                # hardware related part
                # those mount points' options belong to hardware-configuration.nix, but patching it is much harder, than just importing another module
                fileSystems."/" = { device = "/dev/vda1"; options = [ "noatime" "discard"]; };
                fileSystems."/mnt/bitcoind-signet" = { device = "/dev/disk/by-id/scsi-0DO_Volume_${var.DROPLET_NAME}-bitcoind-signet"; fsType = "xfs"; options = [ "noatime" "discard"]; };
                fileSystems."/mnt/electrs-signet" = { device = "/dev/disk/by-id/scsi-0DO_Volume_${var.DROPLET_NAME}-electrs-signet"; fsType = "xfs"; options = [ "noatime" "discard"]; };
                swapDevices = [
                  { device = "/tmp/swap";
                    size = 2048;
                  }
                ];
                # op-energy part
                services.op-energy-backend = {
                # keeping testnet commented to have testnet ports in quick access
                #  testnet = {
                #    db_user = "topenergy";
                #    db_name = "topenergy";
                #    db_psk = op-energy-db-psk-testnet;
                #    config = ''
                #      {
                #        "MEMPOOL": {
                #          "NETWORK": "testnet",
                #          "BACKEND": "electrum",
                #          "HTTP_PORT": 8997,
                #          "API_URL_PREFIX": "/api/v1/",
                #          "POLL_RATE_MS": 2000
                #        },
                #        "CORE_RPC": {
                #          "USERNAME": "top-energy",
                #          "PASSWORD": "$${bitcoind-testnet-rpc-psk}",
                #          "PORT": 18332
                #        },
                #        "ELECTRUM": {
                #          "HOST": "127.0.0.1",
                #          "PORT": 60001,
                #          "TLS_ENABLED": false
                #        },
                #        "DATABASE": {
                #          "ENABLED": true,
                #          "HOST": "127.0.0.1",
                #          "PORT": 3306,
                #          "DATABASE": "topenergy",
                #          "USERNAME": "topenergy",
                #          "PASSWORD": "$${op-energy-db-psk-testnet}"
                #        },
                #        "STATISTICS": {
                #          "ENABLED": true,
                #          "TX_PER_SECOND_SAMPLE_PERIOD": 150
                #        }
                #      }
                #    '';
                #  };
                  signet = {
                    db_user = "sopenergy";
                    db_name = "sopenergy";
                    db_psk = op-energy-db-psk-signet;
                    config = ''
                      {
                        "MEMPOOL": {
                          "NETWORK": "signet",
                          "BACKEND": "electrum",
                          "HTTP_PORT": 8995,
                          "API_URL_PREFIX": "/api/v1/",
                          "POLL_RATE_MS": 2000
                        },
                        "CORE_RPC": {
                          "USERNAME": "sop-energy",
                          "PASSWORD": "$${bitcoind-signet-rpc-psk}",
                          "PORT": 38332
                        },
                        "ELECTRUM": {
                          "HOST": "127.0.0.1",
                          "PORT": 60601,
                          "TLS_ENABLED": false
                        },
                        "DATABASE": {
                          "ENABLED": true,
                          "HOST": "127.0.0.1",
                          "PORT": 3306,
                          "DATABASE": "sopenergy",
                          "USERNAME": "sopenergy",
                          "PASSWORD": "$${op-energy-db-psk-signet}"
                        },
                        "STATISTICS": {
                          "ENABLED": true,
                          "TX_PER_SECOND_SAMPLE_PERIOD": 150
                        }
                      }
                    '';
                  };
                };
                # enable op-energy-frontend service
                services.op-energy-frontend = {
                  enable = true;
                  signet_enabled = true;
                };

                # enable electrs service
                services.electrs = {
                  signet = { # signet instance
                    db_dir = "/mnt/electrs-signet";
                    cookie_file = "/mnt/bitcoind-signet/signet/.cookie";
                    blocks_dir = "/mnt/bitcoind-signet/signet/blocks";
                    network = "signet";
                    rpc_listen = "127.0.0.1:60601";
                    daemon_rpc_addr = "127.0.0.1:38332";
                  };
                };

                # bitcoind signet instance
                services.bitcoind.signet = {
                  enable = true;
                  dataDir = "/mnt/bitcoind-signet";
                  extraConfig = ''
                    txindex = 1
                    server=1
                    listen=1
                    discover=1
                    rpcallowip=127.0.0.1
                    # those option affects memory footprint of the instance, so changing the default value
                    # will affect the ability to shrink the node's resources.
                    # default value is 450 MiB
                    # dbcache=3700
                    # default value is 125, affects RAM occupation
                    # maxconnections=1337
                    signet = 1
                    [signet]
                  '';
                  rpc.users = {
                    sop-energy = {
                      name = "sop-energy";
                      passwordHMAC = "$${bitcoind-signet-rpc-pskhmac}";
                    };
                  };
                };

                # List packages installed in system profile. To search, run:
                # $ nix search wget
                environment.systemPackages = with pkgs; [
                  screen
                  atop # process monitor
                  tcpdump # traffic sniffer
                  iftop # network usage monitor
                  git
                ];
                # Enable the OpenSSH daemon.
                services.openssh.enable = true;

                # Open ports in the firewall.
                networking.firewall.allowedTCPPorts = [
                  22
                  80
                ];
                # networking.firewall.allowedUDPPorts = [ ... ];
                # Or disable the firewall altogether.
                networking.firewall.enable = true;
                networking.firewall.logRefusedConnections = false; # we are not interested in a logs of refused connections
              }
          runcmd:
            - mkdir -p /etc/nixos/overlays
            - dnf install -y git python3
            - git clone https://github.com/dambaev/electrs-overlay.git /etc/nixos/overlays/electrs-overlay
            - git clone -b op-energy-master https://github.com/dambaev/op-energy.git /etc/nixos/overlays/op-energy
            - /etc/nixos/overlays/op-energy/nix/gen-psk.sh /etc/nixos/private/ signet
            - dd if=/dev/zero of=/tmp/swap bs=1M count=2048
            - mkswap /tmp/swap
            - swapon /tmp/swap
            - curl https://raw.githubusercontent.com/elitak/nixos-infect/master/nixos-infect | PROVIDER=digitalocean NIXOS_IMPORT=./host.nix NIX_CHANNEL=nixos-21.05 bash 2>&1 | tee /tmp/infect.log
  EOT

  count = 1
}