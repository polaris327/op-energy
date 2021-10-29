# this script is generating the passwords for mempool instances. Does not requires arguments
# Requires:
# - python3 - for running rpcauth.py (from bitcoin)
# - curl / wget - for downloading rpcauth.py

set -ex

declare -A db_users=( ["mainnet"]="mempool" ["testnet"]="tmempool" ["signet"]="smempool")
declare -A db_names=( ["mainnet"]="mempool" ["testnet"]="tmempool" ["signet"]="smempool")

mkdir -p /etc/nixos/private

function curlOrWget() {
    local backend=curl
    curl --version >/dev/null 2>/dev/null || {
        backend="wget -O -"
        wget --verion > /dev/null 2>/dev/null || {
            echo "ERROR: there is no curl or wget available"
            exit 1
        }
    }
    $backend $@
}

for NETWORK in mainnet testnet signet; do
    PSK=$(dd if=/dev/urandom bs=1 count=10 2>/dev/null | sha256sum | awk '{print $1}')
    printf "%s" $PSK > /etc/nixos/private/bitcoind-$NETWORK-rpc-psk.txt
    HMAC=$(curlOrWget https://raw.githubusercontent.com/bitcoin/bitcoin/master/share/rpcauth/rpcauth.py | python3 - "${db_users[$NETWORK]}" "$PSK" | grep rpcauth | awk 'BEGIN{FS=":"}{print $2}')
    printf "%s" "$HMAC" > /etc/nixos/private/bitcoind-$NETWORK-rpc-pskhmac.txt 
    # DB PSK
    PSK=$(dd if=/dev/urandom bs=1 count=10 2>/dev/null | sha256sum | awk '{print $1}')
    printf "%s" "$PSK" > /etc/nixos/private/mempool-db-psk-$NETWORK.txt
done
