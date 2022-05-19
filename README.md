# Pre-requisite
1) Node.js <br />
    Download and install Node.js from https://nodejs.org/en/
2) Truffle
    Install truffle via npm <br />
    **npm install -g truffle**
3) Ganache-cli
    Install ganache-cli via npm <br />
    **npm install -g ganache-cli**

# Setup
Clone the project and install the components <br />
  **npm install -g truffle**

# Contracts Migration
1) Open truffle-config.js and add your private key & BSCScan API
2) start migration to main net. Replace bscMainNet to bscTestNet for migration to test net<br />
**truffle migrate -f 1 --to 4 --network bscMainNet**

# Contracts test 
1) Open a new terminal and start ganache-cli <br />
    **ganache-cli**
2) Open a new terminal and execute test script <br />
    **truffle test**
