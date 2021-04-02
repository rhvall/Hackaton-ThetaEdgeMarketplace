//  Theta Edge Marketplace
//
//  Created by RHVT on 01/Mar/2021.
//  Copyright © 2021 R. All rights reserved.
//
////////////////////////////////////////////////////////////////////////
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, version 3 or later.
//
// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.
////////////////////////////////////////////////////////////////////////

import React, { Component } from "react";
import { ToastContainer } from 'react-toastify'
import PropTypes from 'prop-types'
import { AccountData } from "@drizzle/react-components";
import logo from "./images/ThetaHackaton.png";

import thetaContract from "./contracts/DistributedTask"

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001,
                        protocol: "https", apiPath:'/api/v0' });

const thetajs = require("@thetalabs/theta-js");
const thetaWalletConnect = require("@thetalabs/theta-wallet-connect");

const TCOOKIE = "ThetaEdgeMarketplacePrivKey";

class DComponent extends Component
{
    constructor(props, context)
    {
        // IPFS = bafybeiguzlisexandrqqcvidxtpjtid2acudavdebot6zdck5hcjguxc4i
        // 1 theta = 1000000000000000000 Wei
        super(props);

        const chainId = thetajs.networks.ChainIds.Privatenet;
        const provider = new thetajs.providers.HttpProvider(chainId);

        //console.log("Constructor: ", props);
        //console.log("Context: ", context);

        this.state = {
            contract: context.drizzle.contracts.DistributedTask,
            account: props.accounts[0],
            fileBuffer: null,
            fileHash: "Qmdaw5ZUeZ484N9FfgQDHM57XeTw2MuCTjPdDpUGBvk1KV",
            taskHash: "",
            taskValue: 0,
            solutionTask: "",
            solutionHash: "",
            taskList: [],
            solutionList: [],
            thetaProvider: provider,
            thetaWallet: {},
            thetaAccount: {},
            thetaAccountPrivKey: ""
        };

        const privCookie = this.getCookie(TCOOKIE);
        if (privCookie.length !== 0) {
            this.thetaPrivKeySubmit(privCookie);
        }

        // this.loadContractData();
    }


    setCookie = (cname, cvalue, exdays) =>
    {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    getCookie = cname =>
    {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i = 0; i < ca.length; i++)
        {
            var c = ca[i];
            while (c.charAt(0) == ' ')
            {
                c = c.substring(1);
            }

            if (c.indexOf(name) == 0)
                return c.substring(name.length, c.length);
        }

        return "";
    }

    removeCookieAndState = () =>
    {
        this.setState({
            thetaWallet: {},
            thetaAccount: {},
            thetaAccountPrivKey: ""
        });

        this.setCookie(TCOOKIE, "", 10);
    }

    loadContractData = async (connectedWallet) =>
    {
        const contractAddress = "0x01eaca027c07e6e6891f30926e80876f40505a4d";
        const contract = new thetajs.Contract(contractAddress, thetaContract.abi, connectedWallet);
        console.log("Contract:", contract);

        try {
            const tasksPre = await contract.retrieveTaskList();

            this.setState((state, props) => (
                { solutionList: [] }
            ));
            const tasks = tasksPre.map((elem) => {
                var arr = [];
                arr[0] = elem[0];
                arr[1] = elem[1];
                arr[2] = thetajs.utils.fromWei(elem[2]);
                this.solutionsForTask(arr[1], contract);
                return arr;
            });
            console.log("TaskList: ", tasks);
            this.setState({
                taskList: tasks
            });
        } catch (e) {
            console.log("Error loading contract data", e);
        }



        // // console.log("loadContractData Contract: ", this.state.contract);
        // const taskListMethod = this.state.contract.methods.retrieveTaskList();
        // taskListMethod.call((err, res) =>
        // {
        //     if (err) {
        //         //console.log("Error loading Blockchain data", err);
        //         return
        //     }
        //
        //     //console.log("Active Tasks: ", res);
        //     this.setState({
        //         taskList: res
        //     });
        //
        //     this.setState((state, props) => (
        //         { solutionList: [] }
        //     ));
        //     res.map((task) => {
        //         this.solutionsForTask(task[1]);
        //         return {};
        //     });
        // }
        // );
    }

    solutionsForTask = async (task, contract) =>
    {
        try {
            const res = await contract.retrieveSolutionList(task);
            if (res.length <= 0) {
                return;
            }

            this.setState((state, props) => {
                var elems = state.solutionList;
                elems.push(res)
                return { solutionList: elems }
            });
        } catch (e) {
            console.log("Error at solutions for task:", task, e);
        }

        // const solListMethod = this.state.contract.methods.retrieveSolutionList(task);
        // solListMethod.call((err, res) =>
        // {
        //     if (err) {
        //         //console.log("Error loading solutions: ", err);
        //         return;
        //     }
        //
        //     //console.log("Solutions for Task:", task, res);
        //
        //     if (res.length <= 0) {
        //         return;
        //     }
        //
        //     this.setState((state, props) => {
        //         var elems = state.solutionList;
        //         elems.push(res)
        //         return { solutionList: elems }
        //     });
        // })
    }

    taskListProp = tasks => {
        if (tasks.length <= 0) {
            return;
        }

        return (
            <React.Fragment>
            <h2> Task List </h2>
            <table>
            <tbody>
            <tr>
                <th key="IPFS Hash"> IPFS Hash </th>
                <th key="TFuel Reward"> Reward </th>
                <th key="Initiator"> Initiator </th>
            </tr>
            {
                tasks.map((task) =>
                    <tr key={task[1]}>
                    <td key={task[1]}>{task[1]}</td>
                    <td key={task[2]}>{task[2]}</td>
                    <td key={task[0]}>{task[0]}</td>
                    </tr>
                )
            }
            </tbody>
            </table>
            </React.Fragment>
        );
    }

    solutionListProp = sols => {
        if (sols.length <= 0) {
            return;
        }

        return (
            <React.Fragment>
            <h2> Registered solutions </h2>
            <table>
            <tbody>
            <tr>
                <th key="Task"> Task Hash </th>
                <th key="Solution"> IPFS Solution </th>
                <th key="Solver"> Solver </th>
            </tr>
            {
                Object.entries(sols).map(([task, solution], i) =>
                    solution.map((sol) =>
                    <tr key={"Sol"+JSON.stringify(sol[1])}>
                    <td key={sol[0]}>{sol[0]}</td>
                    <td key={sol[1]}>{sol[1]}</td>
                    <td key={sol[2]}>{sol[2]}</td>
                    </tr>
                ))
            }
            </tbody>
            </table>
            </React.Fragment>
        );
    }

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
    thetaLoadAccount = (thetaAccount) =>
    {
        if (Object.keys(thetaAccount).length !== 0) {
            return;
        }
        return (
            <React.Fragment>
            <h2> Load a theta account using Private Key </h2>
            <form onSubmit={this.thetaPrivKeySubmitEvent} >
                <input type="text" id="thetaAccountPrivKey" placeholder="Private Key"
                    minLength="10" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <br/>
                <input type='submit' />
            </form>
            </React.Fragment>
        )
    }

    thetaAccountDetails = (thetaWallet, thetaAccount) =>
    {
        if (Object.keys(thetaAccount).length === 0) {
            return;
        }

        const theta = thetajs.utils.fromWei(thetaAccount.coins.thetawei);
        const tfuel = thetajs.utils.fromWei(thetaAccount.coins.tfuelwei);
        return (
            <React.Fragment>
            <h2> Theta account </h2>
            <p>Account: <b>{thetaWallet.address}</b></p>
            <p>Theta: <b>{theta}</b></p>
            <p>TFUel: <b>{tfuel}</b></p>
            <button type="button" className="logout" onClick={this.removeCookieAndState}>Log out</button>
            </React.Fragment>
        )
    }

    thetaPrivKeySubmitEvent = async (event) =>
    {
        event.preventDefault();
        const privKey = this.state.thetaAccountPrivKey;
        this.thetaPrivKeySubmit(privKey);
    }

    thetaPrivKeySubmit = async (privKey) =>
    {
        const provider = this.state.thetaProvider;
        const wallet = new thetajs.Wallet(privKey);
        const connectedWallet = await wallet.connect(provider);
        const connectedAccount = await provider.getAccount(connectedWallet.address);
        console.log("connectedWallet:", connectedWallet);
        this.setState({
            thetaAccount: connectedAccount,
            thetaWallet: connectedWallet
        })

        this.setCookie(TCOOKIE, privKey, 10);

        this.loadContractData(this.state.thetaWallet);
    }
////////////////////////////////////////////////////////////////////////////////


    handleFormChange = e => {
        this.setState({ [e.target.id]: e.target.value });
    }

    handleKeyDown = e => {
        // if the enter key is pressed, call the contract action
        if (e.keyCode === 13) {
            switch (e.target.id) {
                case "thetaAccountPrivKey":
                    this.thetaPrivKeySubmitEvent(e);
                break;
            }
            // const taskValue = this.state.taskValue;
            // const taskHash = this.state.taskHash;
            //
            // if (taskValue <= 0) {
            //     //console.log("Task value should be greater than 0");
            //     return;
            // }
            //
            // if (taskHash.length <= 3) {
            //     //console.log("Task hash should be greater than 3 characters");
            //     return;
            // }
            //
            // this.taskSubmit(e);
        }
    };

    captureFile = (event) =>
    {
        event.preventDefault();
        const file = event.target.files[0];
        const reader = new window.FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = () => {
            this.setState({ fileBuffer: Buffer(reader.result) });
        }
    }

    taskSubmit = async (event) =>
    {
        event.preventDefault();
        const taskHash = this.state.taskHash;
        const taskValue = this.state.taskValue;
        const acc0 = this.state.account;
        //console.log("TaskHash:", taskHash);
        //console.log("TaskValue:", taskValue);
        try {
            this.state.contract.methods.commitTaskHash(taskHash).send
            ({ from: acc0, value: taskValue }, (err, res) =>
            {
                if (err) {
                    //console.log("An error occured", err);
                    return;
                }
                    //console.log("Hash of the transaction: " + res);
                    // setTimeout(this.loadContractData, 1000);
                }
            );
        } catch (e)
        {
            //console.log('Failed task submission:', e);
        }
    }

    solutionSubmit = async (event) =>
    {
        event.preventDefault();
        const solutionTask = this.state.solutionTask;
        const solutionHash = this.state.solutionHash;
        const acc0 = this.state.account;
        //console.log("solutionTask:", solutionTask);
        //console.log("solutionHash:", solutionHash);
        try {
            this.state.contract.methods.commitSolutionHash(solutionTask, solutionHash).send
            ({ from: acc0 }, (err, res) =>
            {
                if (err) {
                    //console.log("An error occured", err)
                    return
                }
                    //console.log("Hash of the solution transaction: " + res)
                    setTimeout(this.loadContractData, 1000);
                }
            );
        } catch (e)
        {
            //console.log('Failed task submission:', e);
        }
    }

    taskSolvedSubmit = async (event) =>
    {
        event.preventDefault();
        const taskSolution = this.state.taskSolution;
        const taskHashSolution = this.state.taskHashSolution;
        const acc0 = this.state.account;
        //console.log("taskHashSolution:", taskSolution);
        //console.log("taskHashSolution:", taskHashSolution);
        try {
            this.state.contract.methods.markTaskSolved(taskHashSolution, taskSolution).send
            ({ from: acc0 }, (err, res) =>
            {
                if (err) {
                    //console.log("An error occured", err);
                    return;
                }
                    //console.log("Hash of the solution transaction: " + res);
                    setTimeout(this.loadContractData, 1000);
                }
            );
        } catch (e)
        {
            //console.log('Failed task submission:', e);
        }
    }

// QmXJNGZBy9265uzwTXdARRS2fc7xg6cMtCjnD6Cy1b11Ui
    fileSubmit = async (event) =>
    {
        event.preventDefault();
        //console.log("File to be submitted...");
        //console.log("Buffer:", this.state.fileBuffer);
        const fileAddRes = await ipfs.add(this.state.fileBuffer);
        //console.log(fileAddRes);
        this.setState({ fileHash: fileAddRes.cid.string });
        // ipfs.add(this.state.fileBuffer, (error, result) => {
        //     if (error) {
        //         console.log('IPFS error', error);
        //     } else {
        //         console.log('IPFS result', result);
        //         const fileHash = result[0].hash;
        //         this.setState({ fileHash: fileHash });
        //     }
        // });
    }

    render()
    {
        return (
        <div className="App">
            <ToastContainer />
            <div>
                <img src={logo} alt="Hackaton-Logo" />
                <h1>Theta Edge Marketplace with Neural Networks</h1>
                <p>Employ the Theta Network to deploy computations using edge nodes
                and providing bounties for their results.
                </p>
            </div>
            <div>
                {this.thetaLoadAccount(this.state.thetaWallet)}
            </div>
            <div>
                {this.thetaAccountDetails(this.state.thetaWallet, this.state.thetaAccount)}
            </div>
        {
            // <div>
            //     <nav className="navbar">
            //         <h5> Account: </h5>
            //         <AccountData accountIndex={0} units={"ether"} precision={2} />
            //     </nav>
            // </div>
        }
        {
            // <div>
            //     <h2>Change meme</h2>
            //     <div>
            //         <img alt="Img File" src={`https://ipfs.infura.io/ipfs/${this.state.fileHash}`} />
            //     </div>
            //     <form onSubmit={this.fileSubmit} >
            //         <input type="file" onChange={this.captureFile} />
            //         <input type='submit' />
            //     </form>
            // </div>
        }
            <div>
                { this.taskListProp(this.state.taskList) }
            </div>
            <div>
                { this.solutionListProp(this.state.solutionList) }
            </div>

            <div>
                <h2> Add Task </h2>
                <form onSubmit={this.taskSubmit} >
                    <label>TFuel for Task:</label>
                    <input type="text" id="taskValue" placeholder="Task TFuel value" minLength="1" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                    <br/>
                    <label>IPFS Hash:</label>
                    <input type="text" id="taskHash" placeholder="Task Hash" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                    <input type='submit' />
                </form>
            </div>
            <div>
                <h2> Add Solution to task </h2>
                <form onSubmit={this.solutionSubmit} >
                    <label>Task:</label>
                    <input type="text" id="solutionTask" placeholder="Task hash" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                    <br/>
                    <label>Solution IPFS Hash:</label>
                    <input type="text" id="solutionHash" placeholder="Solution Hash" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                    <input type='submit' />
                </form>
            </div>
            <div>
                <h2> Mark task as solved </h2>
                <form onSubmit={this.taskSolvedSubmit} >
                    <label>Task solution:</label>
                    <input type="text" id="taskSolution" placeholder="Task solution" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                    <br/>
                    <label>Task Hash:</label>
                    <input type="text" id="taskHashSolution" placeholder="Task Hash" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                    <input type='submit' />
                </form>
            </div>
        </div>
    ); }
}

DComponent.contextTypes = {
    drizzle: PropTypes.object
}

export default DComponent;
