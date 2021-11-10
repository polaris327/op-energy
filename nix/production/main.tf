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

resource "digitalocean_volume" "bitcoind_mainnet" {
  region                  = var.DO_REGION
  name                    = "${var.DROPLET_NAME}-bitcoind-mainnet"
  size                    = 440
  initial_filesystem_type = "xfs"
  description             = "volume for blockchain"
}
resource "digitalocean_volume" "electrs_mainnet" {
  region                  = var.DO_REGION
  name                    = "${var.DROPLET_NAME}-electrs-mainnet"
  size                    = 85
  initial_filesystem_type = "xfs"
  description             = "volume for index"
}

resource "digitalocean_droplet" "droplet_instance" {
  name   = var.DROPLET_NAME
  size   = "s-4vcpu-8gb"
  image  = "centos-8-x64"
  region = var.DO_REGION
  ssh_keys = var.SSH_KEYS_IDS
  volume_ids = [ digitalocean_volume.bitcoind_mainnet.id, digitalocean_volume.electrs_mainnet.id ]
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
                bitcoind-mainnet-rpc-psk = builtins.readFile ( "/etc/nixos/private/bitcoind-mainnet-rpc-psk.txt");
                # TODO: refactor to autogenerate HMAC from the password above
                bitcoind-mainnet-rpc-pskhmac = builtins.readFile ( "/etc/nixos/private/bitcoind-mainnet-rpc-pskhmac.txt");
                op-energy-db-psk-mainnet = builtins.readFile ( "/etc/nixos/private/op-energy-db-psk-mainnet.txt");
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
                fileSystems."/mnt/bitcoind-mainnet" = { device = "/dev/disk/by-id/scsi-0DO_Volume_${var.DROPLET_NAME}-bitcoind-mainnet"; fsType = "xfs"; options = [ "noatime" "discard"]; };
                fileSystems."/mnt/electrs-mainnet" = { device = "/dev/disk/by-id/scsi-0DO_Volume_${var.DROPLET_NAME}-electrs-mainnet"; fsType = "xfs"; options = [ "noatime" "discard"]; };
                swapDevices = [
                  { device = "/tmp/swap";
                    size = 2048;
                  }
                ];
                # op-energy part
                services.op-energy-backend = {
                  mainnet = {
                    db_user = "openergy";
                    db_name = "openergy";
                    db_psk = op-energy-db-psk-mainnet;
                    config = ''
                      {
                        "MEMPOOL": {
                          "NETWORK": "mainnet",
                          "BACKEND": "electrum",
                          "HTTP_PORT": 8999,
                          "API_URL_PREFIX": "/api/v1/",
                          "POLL_RATE_MS": 2000
                        },
                        "CORE_RPC": {
                          "USERNAME": "op-energy",
                          "PASSWORD": "$${bitcoind-mainnet-rpc-psk}"
                        },
                        "ELECTRUM": {
                          "HOST": "127.0.0.1",
                          "PORT": 50001,
                          "TLS_ENABLED": false
                        },
                        "DATABASE": {
                          "ENABLED": true,
                          "HOST": "127.0.0.1",
                          "PORT": 3306,
                          "DATABASE": "openergy",
                          "USERNAME": "openergy",
                          "PASSWORD": "$${op-energy-db-psk-mainnet}"
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
                };

                # enable electrs service
                services.electrs = {
                  mainnet = { # signet instance
                    db_dir = "/mnt/electrs-mainnet";
                    cookie_file = "/mnt/bitcoind-mainnet/.cookie";
                    blocks_dir = "/mnt/bitcoind-mainnet/blocks";
                  };
                };

                # bitcoind mainnet instance
                services.bitcoind.mainnet = {
                  enable = true;
                  dataDir = "/mnt/bitcoind-mainnet";
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
                  '';
                  rpc.users = {
                    op-energy = {
                      name = "op-energy";
                      passwordHMAC = "$${bitcoind-mainnet-rpc-pskhmac}";
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
            - /etc/nixos/overlays/op-energy/nix/gen-psk.sh /etc/nixos/private/ mainnet
            - dd if=/dev/zero of=/tmp/swap bs=1M count=2048
            - mkswap /tmp/swap
            - swapon /tmp/swap
            - curl https://raw.githubusercontent.com/elitak/nixos-infect/master/nixos-infect | PROVIDER=digitalocean NIXOS_IMPORT=./host.nix NIX_CHANNEL=nixos-21.05 bash 2>&1 | tee /tmp/infect.log
  EOT

  count = 1
}