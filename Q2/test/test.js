const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { plonk, groth16 } = require("snarkjs");

function unstringifyBigInts(o) {
//if the type of variable o is string and the string is a series of numbers, change type 
//to BigInt
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
//if the type of variable o is string and the string and hex, change type 
//to BigInt
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
//if o is an array, take each element of the array and return each type of it
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
//if o is an object, and o is the null object, return null
    } else if (typeof o == "object") {
        if (o===null) return null;
        //declare an empty object res
        const res = {};
        //declare keys as an array of the property names of o
        const keys = Object.keys(o);
        //deconstruct o and put it in res
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {

        //initialize instance of the contract
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        //deploy instance of the contract using a promise
        verifier = await Verifier.deploy();

        //return the value from the promise
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        //set two variables, proof and publicSignals, as objs returned by the output of fullProve()
        //fullProve is a fcn that takes citrcuit and circuitSetup files and input signals and returns a proof and publicSignals objs
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        //write 1x2= value of publicSignals[0])
        console.log('1x2 =',publicSignals[0]);

        //declare editedPublicSignals and initialize it to unstringify publicSignals in bigInts
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        //declare editedProof and initialize it to unstringify proof in bigInts
        const editedProof = unstringifyBigInts(proof);
        //transform the proof and publicSignals into Ethereum calldata
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        //split after "," and trasform to string
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        console.log(argv);

        //initialize a to first two elements of argv
        const a = [argv[0], argv[1]];
        //initialize b to the 4 next elements of argv
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];

        //initialize c to the 2 next elements of argv
        const c = [argv[6], argv[7]];
        //cut argv in 8 equal slices
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        //initialize a to null
        let a = [0, 0];
        //initialize a to null
        let b = [[0, 0], [0, 0]];
        //initialize c to null
        let c = [0, 0];
        //initialize d to null
        let d = [0]
        //expect that the result of verifyProof() returns false
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {

    //
    beforeEach(async function () {
        //[assignment] insert your script here

        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();

    });

    it("Should return true for correct proof", async function () {
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");

        //write 1x2= value of publicSignals[0])
        console.log('1x2x3 =',publicSignals[0]);
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        //declare editedProof and initialize it to unstringify proof in bigInts
        const editedProof = unstringifyBigInts(proof);
        //transform the proof and publicSignals into Ethereum calldata
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);

        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        console.log(argv);

        //initialize a to first two elements of argv
        const a = [argv[0], argv[1]];
        //initialize b to the 4 next elements of argv
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];

        //initialize c to the 2 next elements of argv
        const c = [argv[6], argv[7]];
        //cut argv in 8 equal slices
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });


    it("Should return false for invalid proof", async function () {

         //initialize a to null
         let a = [0, 0];
         //initialize a to null
         let b = [[0, 0], [0, 0]];
         //initialize c to null
         let c = [0, 0];
         //initialize d to null
         let d = [0]
         //expect that the result of verifyProof() returns false
         expect(await verifier.verifyProof(a, b, c, d)).to.be.false;

        //[assignment] insert your script here
    });
});


describe("Multiplier3 with PLONK", function () {

    beforeEach(async function () {
       Verifier = await ethers.getContractFactory("PlonkVerifier");
       verifier = await Verifier.deploy();
       await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        const { proof, publicSignals } = await plonk.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/_plonkMultiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/_plonkMultiplier3/circuit_0000.zkey");
        console.log("1x2x3 =", publicSignals[0]);

        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);

        let calldata = await plonk.exportSolidityCallData(editedProof, editedPublicSignals);
    
      
        calldata = calldata.split(',');
        expect(await verifier.verifyProof(calldata[0], JSON.parse(calldata[1]))).to.be.true;

    });
    it("Should return false for invalid proof", async function () {
        let a = '0x01';
        let b = ['1'];
        expect(await verifier.verifyProof(a, b)).to.be.false;     
    });
});
