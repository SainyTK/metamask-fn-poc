import { Button, Container, Grid, Row, Text } from "@nextui-org/react";
import type { NextPage } from "next";

import MetaMaskOnboarding from "@metamask/onboarding";
import { useEffect, useState } from "react";
import { ADDRESS_LIST } from "../src/constants";
import {
  encrypt,
  recoverPersonalSignature,
  recoverTypedSignatureLegacy,
  recoverTypedSignature,
  recoverTypedSignature_v4 as recoverTypedSignatureV4,
} from "eth-sig-util";
import { toChecksumAddress } from "ethereumjs-util";
import * as ethers from "ethers";
import { ERC20Permit, ERC20Permit__factory } from "../src/typechain-types";
import {
  defaultAbiCoder,
  keccak256,
  parseEther,
  solidityPack,
  toUtf8Bytes,
} from "ethers/lib/utils";

const Home: NextPage = () => {
  const [text, setText] = useState("");

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const forwarderOrigin =
      currentUrl.hostname === "localhost" ? "http://localhost:9010" : undefined;

    const onboarding = new MetaMaskOnboarding({ forwarderOrigin });

    const urlSearchParams = new URLSearchParams(window.location.search);
    const { isMetaMaskInstalled } = MetaMaskOnboarding;

    console.log({ onboarding });
    console.log({ isMetaMaskInstalled });
  }, []);

  const watchAsset = async () => {
    // add token
    const result = await (window as any).ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: ADDRESS_LIST.PMT,
          symbol: "PMT",
          decimals: 18,
          image: "https://metamask.github.io/test-dapp/metamask-fox.svg",
        },
      },
    });
    console.log("result", result);
  };

  const requestPermissions = async () => {
    const permissionsArray = await (window as any).ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
    console.log(permissionsArray);
  };

  const getAccounts = async () => {
    const _accounts = await (window as any).ethereum.request({
      method: "eth_accounts",
    });
    console.log(_accounts);
  };

  const getEncryptedPublicKey = async () => {
    const _accounts = await (window as any).ethereum.request({
      method: "eth_accounts",
    });
    const encryptionKey = await (window as any).ethereum.request({
      method: "eth_getEncryptionPublicKey",
      params: [_accounts[0]],
    });
    console.log(encryptionKey);
  };

  const sign = async () => {
    const _accounts = await (window as any).ethereum.request({
      method: "eth_accounts",
    });
    const msg =
      "0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0";
    const ethResult = await (window as any).ethereum.request({
      method: "eth_sign",
      params: [_accounts[0], msg],
    });
    console.log(JSON.stringify(ethResult));
  };

  const personalSign = async () => {
    // Sign
    const accounts = await (window as any).ethereum.request({
      method: "eth_accounts",
    });
    const exampleMessage = "Example `personal_sign` message";
    const from = accounts[0];
    const msg = `0x${Buffer.from(exampleMessage, "utf8").toString("hex")}`;
    const sign = await (window as any).ethereum.request({
      method: "personal_sign",
      params: [msg, from, "Example password"],
    });

    console.log(sign);

    // Recover with lib
    const recoveredAddr = recoverPersonalSignature({
      data: msg,
      sig: sign,
    });

    console.log({ recoveredAddr });

    if (recoveredAddr === from) {
      console.log(`SigUtil Successfully verified signer as ${recoveredAddr}`);
    } else {
      console.log(
        `SigUtil Failed to verify signer when comparing ${recoveredAddr} to ${from}`
      );
      console.log(`Failed comparing ${recoveredAddr} to ${from}`);
    }
    // Recover with metamask
    const ecRecoverAddr = await (window as any).ethereum.request({
      method: "personal_ecRecover",
      params: [msg, sign],
    });
    if (ecRecoverAddr === from) {
      console.log(`Successfully ecRecovered signer as ${ecRecoverAddr}`);
    } else {
      console.log(
        `Failed to verify signer when comparing ${ecRecoverAddr} to ${from}`
      );
    }
  };

  const signedTypedData = async () => {
    // Sign
    const accounts = await (window as any).ethereum.request({
      method: "eth_accounts",
    });

    const msgParams = [
      {
        type: "string",
        name: "Message",
        value: "Hi, Alice!",
      },
      {
        type: "uint32",
        name: "A number",
        value: "1337",
      },
    ];
    const from = accounts[0];
    const sign = await (window as any).ethereum.request({
      method: "eth_signTypedData",
      params: [msgParams, from],
    });
    console.log({ sign });

    // Verify
    const recoveredAddr = await recoverTypedSignatureLegacy({
      data: msgParams,
      sig: sign,
    });
    if (toChecksumAddress(recoveredAddr) === toChecksumAddress(from)) {
      console.log(`Successfully verified signer as ${recoveredAddr}`);
    } else {
      console.log(
        `Failed to verify signer when comparing ${recoveredAddr} to ${from}`
      );
    }
  };

  const signedTypedDataV3 = async () => {
    const accounts = await (window as any).ethereum.request({
      method: "eth_accounts",
    });
    const chainId = await (window as any).ethereum.request({
      method: "eth_chainId",
    });

    const msgParams = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
        ],
        Mail: [
          { name: "from", type: "Person" },
          { name: "to", type: "Person" },
          { name: "contents", type: "string" },
        ],
      },
      primaryType: "Mail",
      domain: {
        name: "Ether Mail",
        version: "1",
        chainId,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      },
      message: {
        from: {
          name: "Cow",
          wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
        },
        to: {
          name: "Bob",
          wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
        },
        contents: "Hello, Bob!",
      },
    };

    const from = accounts[0];
    const sign = await (window as any).ethereum.request({
      method: "eth_signTypedData_v3",
      params: [from, JSON.stringify(msgParams)],
    });

    console.log({ sign });

    const recoveredAddr = await recoverTypedSignature({
      data: msgParams as any,
      sig: sign,
    });
    if (toChecksumAddress(recoveredAddr) === toChecksumAddress(from)) {
      console.log(`Successfully verified signer as ${recoveredAddr}`);
    } else {
      console.log(
        `Failed to verify signer when comparing ${recoveredAddr} to ${from}`
      );
    }
  };

  const signedTypedDataV4 = async () => {
    const accounts = await (window as any).ethereum.request({
      method: "eth_accounts",
    });
    const chainId = await (window as any).ethereum.request({
      method: "eth_chainId",
    });

    const msgParams = {
      domain: {
        chainId: chainId.toString(),
        name: "Ether Mail",
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
        version: "1",
      },
      message: {
        contents: "Hello, Bob!",
        from: {
          name: "Cow",
          wallets: [
            "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
            "0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF",
          ],
        },
        to: [
          {
            name: "Bob",
            wallets: [
              "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
              "0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57",
              "0xB0B0b0b0b0b0B000000000000000000000000000",
            ],
          },
        ],
      },
      primaryType: "Mail",
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        Group: [
          { name: "name", type: "string" },
          { name: "members", type: "Person[]" },
        ],
        Mail: [
          { name: "from", type: "Person" },
          { name: "to", type: "Person[]" },
          { name: "contents", type: "string" },
        ],
        Person: [
          { name: "name", type: "string" },
          { name: "wallets", type: "address[]" },
        ],
      },
    };
    const from = accounts[0];
    const sign = await (window as any).ethereum.request({
      method: "eth_signTypedData_v4",
      params: [from, JSON.stringify(msgParams)],
    });

    const s = ethers.utils.splitSignature(sign);
    console.log(s);

    const recoveredAddr = recoverTypedSignatureV4({
      data: msgParams as any,
      sig: sign,
    });
    if (toChecksumAddress(recoveredAddr) === toChecksumAddress(from)) {
      console.log(`Successfully verified signer as ${recoveredAddr}`);
    } else {
      console.log(
        `Failed to verify signer when comparing ${recoveredAddr} to ${from}`
      );
    }
  };

  const signPermitToken = async () => {
    const accounts = await (window as any).ethereum.request({
      method: "eth_accounts",
    });
    const chainId = await (window as any).ethereum.request({
      method: "eth_chainId",
    });

    const TEST_AMOUNT = parseEther("1");
    const tokenAddress = ADDRESS_LIST["PMT"];
    const spender = "0xB83aae754c8D3848Fe0675A3E172C7005B09B11f";
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    const pmt = await ERC20Permit__factory.connect(tokenAddress, provider);
    const nonce = 2;
    const deadline = 1671624828;

    console.log(
      pmt.address,
      { owner: accounts[0], spender, value: TEST_AMOUNT },
      nonce.toString(),
      deadline
    );

    const domain = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ];

    const permit = [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ];

    const domainData = {
      name: "PermitToken",
      version: "1",
      chainId: chainId.toString(),
      verifyingContract: tokenAddress,
    };

    const message = {
      owner: accounts[0],
      spender,
      value: TEST_AMOUNT.toString(),
      nonce: nonce.toString(),
      deadline,
    };

    const msgParams = {
      types: {
        EIP712Domain: domain,
        Permit: permit,
      },
      domain: domainData,
      primaryType: "Permit",
      message,
    };

    const from = accounts[0];
    const sign = await (window as any).ethereum.request({
      method: "eth_signTypedData_v4",
      params: [from, JSON.stringify(msgParams)],
    });

    console.log({ sign });

    const { s, v, r } = ethers.utils.splitSignature(sign);

    console.log(
      `"${
        accounts[0]
      }", "${spender}", "${TEST_AMOUNT.toString()}", ${deadline}, ${v}, "${r}", "${s}"`
    );
  };

  return (
    <div>
      <Grid.Container justify="center">
        <Grid xs={12} md={12} justify="center">
          <Text h2>Metamask Functions</Text>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4>Watch Asset</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={watchAsset}>
            Watch
          </Button>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4> Request permission</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={requestPermissions}>
            Request permission
          </Button>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4>Get Accounts</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={getAccounts}>
            Get Accounts
          </Button>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4>Get Encrypted Public Key</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={getEncryptedPublicKey}>
            Get Encrypted Public Key
          </Button>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4>Sign</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={sign}>
            Sign
          </Button>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4>Personal Sign</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={personalSign}>
            Personal Sign
          </Button>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4>Sign Typed Data</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={signedTypedData}>
            Sign Typed Data
          </Button>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4>Sign Typed Data V3</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={signedTypedDataV3}>
            Sign Typed Data V3
          </Button>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4>Sign Typed Data V4</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={signedTypedDataV4}>
            Sign Typed Data V4
          </Button>
        </Grid>

        <Grid xs={12} md={12} justify="center">
          <Text h4>Sign permit token</Text>
        </Grid>
        <Grid xs={12} md={12} justify="center">
          <Button color="gradient" auto onClick={signPermitToken}>
            Sign permit token
          </Button>
        </Grid>
      </Grid.Container>
    </div>
  );
};

export default Home;
