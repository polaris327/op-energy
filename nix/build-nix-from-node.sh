set -x
set -e

cp ../backend/package.json ./backend/
cp ../backend/package-lock.json ./backend/
node2nix -i ../backend/package.json -l ../backend/package-lock.json -o backend/node-packages.nix -c ./backend/op-energy-backend.nix -e ./backend/node-env.nix
node2nix -i ../backend/package.json -l ../backend/package-lock.json -o backend/node-packages.nix -c ./backend/op-energy-backend.nix -e ./backend/node-env.nix

cp ../frontend/package.json ./frontend/
cp ../frontend/package-lock.json ./frontend/
node2nix -i ../frontend/package.json -l ../frontend/package-lock.json -o frontend/node-packages.nix -c ./frontend/op-energy-frontend.nix -e ./frontend/node-env.nix
node2nix -i ../frontend/package.json -l ../frontend/package-lock.json -o frontend/node-packages.nix -c ./frontend/op-energy-frontend.nix -e ./frontend/node-env.nix

cat node-env.patch | patch -p1
