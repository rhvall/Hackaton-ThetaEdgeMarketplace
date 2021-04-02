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

        this.state = {
            contract: {},
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
            this.thetaPrivKeySubmit(privCookie, provider);
        }
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
            while (c.charAt(0) === ' ')
            {
                c = c.substring(1);
            }

            if (c.indexOf(name) === 0)
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

            this.setState({ contract: contract, solutionList: []});
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
                <th key="TFuel Reward"> TFuel Reward </th>
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

    addTaskProp = () =>
    {
        return (
            <React.Fragment>
            <h2> Add Task </h2>
            <form onSubmit={this.taskSubmit} >
                <label>TFuel for Task:</label>
                <input type="text" id="taskValue" placeholder="Task TFuel value" minLength="1" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <br/>
                <label>IPFS Hash:</label>
                <input type="text" id="taskHash" placeholder="Task Hash" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <input type='submit' />
            </form>
            </React.Fragment>
        );
    }

    addSolutionTaskProp = () => {
        return (
            <React.Fragment>
            <h2> Add Solution to task </h2>
            <form onSubmit={this.solutionSubmit} >
                <label>Task:</label>
                <input type="text" id="solutionTask" placeholder="Task hash" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <br/>
                <label>Solution IPFS Hash:</label>
                <input type="text" id="solutionHash" placeholder="Solution Hash" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <input type='submit' />
            </form>
            </React.Fragment>
        )
    }

    markTaskSolvedProp = () => {
        return (
            <React.Fragment>
            <h2> Mark task as solved </h2>
            <form onSubmit={this.taskSolvedSubmit} >
                <label>Task solution:</label>
                <input type="text" id="taskSolution" placeholder="Task solution" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <br/>
                <label>Task Hash:</label>
                <input type="text" id="taskHashSolution" placeholder="Task Hash" minLength="3" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <input type='submit' />
            </form>
            </React.Fragment>
        )
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
            <h2>Theta account</h2>
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
        const provider = this.state.thetaProvider;
        this.thetaPrivKeySubmit(privKey, provider);
    }

    thetaPrivKeySubmit = async (privKey, thetaProvider) =>
    {
        const wallet = new thetajs.Wallet(privKey);
        const connectedWallet = await wallet.connect(thetaProvider);
        const connectedAccount = await thetaProvider.getAccount(connectedWallet.address);
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
                case "taskValue":
                case "taskHash":
                    this.taskSubmit(e);
                    break;
                case "solutionTask":
                case "solutionHash":
                    this.solutionSubmit(e);
                    break;
                case "taskSolution":
                case "taskHashSolution":
                    this.taskSolvedSubmit(e);
                    break
            }
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
        const taskValue = thetajs.utils.toWei(this.state.taskValue);
        const contract = this.state.contract;
        const overrides = {
            value: taskValue // tfuelWei to send
        };

        console.log("Task submit:", taskHash, taskValue);
        
        try {
            const res = await contract.commitTaskHash(taskHash, overrides);
            console.log("Task submitted: ", res);
            setTimeout(()=>{this.loadContractData((this.state.thetaWallet))}, 1000);
        }
        catch (e)
        {
            console.log("Failed task submission:", e);
        }
    }

    solutionSubmit = async (event) =>
    {
        event.preventDefault();
        const solutionTask = this.state.solutionTask;
        const solutionHash = this.state.solutionHash;
        const contract = this.state.contract;
        console.log("Solution submit", solutionHash, solutionTask);
        try {
            const res = await contract.commitSolutionHash(solutionTask, solutionHash);
            console.log("Result solution transaction: ", res)
            setTimeout(()=>{this.loadContractData((this.state.thetaWallet))}, 1000);
        }
        catch (e)
        {
            console.log('Failed solution submission:', e);
        }
    }

    taskSolvedSubmit = async (event) =>
    {
        event.preventDefault();
        const taskSolution = this.state.taskSolution;
        const taskHashSolution = this.state.taskHashSolution;
        const contract = this.state.contract;
        console.log("Task Solved submit", taskHashSolution, taskSolution);
        try {
            const res = await contract.markTaskSolved(taskHashSolution, taskSolution)
            console.log("Hash of task solved:", res)
            setTimeout(()=>{this.loadContractData((this.state.thetaWallet))}, 1000);
        } catch (e)
        {
            console.log('Failed task solved submission:', e);
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
                { this.thetaLoadAccount(this.state.thetaWallet) }
            </div>
            <div>
                { this.thetaAccountDetails(this.state.thetaWallet, this.state.thetaAccount) }
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

                { this.addTaskProp() }
            <div>
                { this.addSolutionTaskProp() }
            </div>
            <div>
                { this.markTaskSolvedProp() }
            </div>
        </div>
    ); }
}

DComponent.contextTypes = {
    drizzle: PropTypes.object
}

export default DComponent;
