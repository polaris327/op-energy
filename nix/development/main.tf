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

resource "digitalocean_volume" "bitcoind_signet" {
  region                  = var.DO_REGION
  name                    = "${var.DROPLET_NAME}-bitcoind-signet"
  size                    = 1
  initial_filesystem_type = "xfs"
  description             = "volume for blockchain"
}
resource "digitalocean_volume" "electrs_signet" {
  region                  = var.DO_REGION
  name                    = "${var.DROPLET_NAME}-electrs-signet"
  size                    = 1
  initial_filesystem_type = "xfs"
  description             = "volume for index"
}

resource "digitalocean_droplet" "droplet_instance" {
  name   = var.DROPLET_NAME
  size   = "s-1vcpu-1gb"
  image  = "centos-8-x64"
  region = var.DO_REGION
  ssh_keys = var.SSH_KEYS_IDS
  volume_ids = [ digitalocean_volume.bitcoind_signet.id, digitalocean_volume.electrs_signet.id ]
  user_data = <<-EOT
    #cloud-config
          write_files:
          - path: /etc/nixos/host.nix
            permissions: '0644'
            content: |
              {pkgs, ...}:
              {
                # those mount points' options belong to hardware-configuration.nix, but patching it is much harder, than just importing another module
                fileSystems."/" = { device = "/dev/vda1"; options = [ "noatime" "discard"]; };
                fileSystems."/mnt/bitcoind-signet" = { device = "/dev/disk/by-id/scsi-0DO_Volume_${var.DROPLET_NAME}-bitcoind-signet"; fsType = "xfs"; options = [ "noatime" "discard"]; };
                fileSystems."/mnt/electrs-signet" = { device = "/dev/disk/by-id/scsi-0DO_Volume_${var.DROPLET_NAME}-electrs-signet"; fsType = "xfs"; options = [ "noatime" "discard"]; };
              }
          runcmd:
            - curl https://raw.githubusercontent.com/elitak/nixos-infect/master/nixos-infect | PROVIDER=digitalocean NIXOS_IMPORT=./host.nix NIX_CHANNEL=nixos-21.05 bash 2>&1 | tee /tmp/infect.log
  EOT

  count = 1
}