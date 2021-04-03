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
import logo from "./images/ThetaHackaton.png";

import thetaContract from "./contracts/DistributedTask"

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001,
                        protocol: "https", apiPath:'/api/v0' });

const thetajs = require("@thetalabs/theta-js");

const TCOOKIE = "ThetaEdgeMarketplacePrivKey";
const TEXPACC = "https://smart-contracts-sandbox-explorer.thetatoken.org/account/"
const CONTRACTADDRESS = "0x01eaca027c07e6e6891f30926e80876f40505a4d";
const IPFSEXPLORER = "https://explore.ipld.io/#/explore/"

class DComponent extends Component
{
    constructor(props, context)
    {
        // IPFS = bafybeiguzlisexandrqqcvidxtpjtid2acudavdebot6zdck5hcjguxc4i
        // 1 theta = 1000000000000000000 Wei
        // Min Wei = 10000001
        // Min Theta = 0.00000000010000001
        super(props);

        const chainId = thetajs.networks.ChainIds.Privatenet;
        const provider = new thetajs.providers.HttpProvider(chainId);

        this.state = {
            contract: {},
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
            taskList: [],
            solutionList: [],
            thetaWallet: {},
            thetaAccount: {},
            thetaAccountPrivKey: ""
        });

        this.setCookie(TCOOKIE, "", 10);
    }

    loadContractData = async (connectedWallet) =>
    {
        const contract = new thetajs.Contract(CONTRACTADDRESS, thetaContract.abi, connectedWallet);
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
                    <td key={task[1]}><a href={IPFSEXPLORER + task[1]}>{task[1]}</a></td>
                    <td key={task[2]}>{task[2]}</td>
                    <td key={task[0]}><a href={TEXPACC + task[0]}>{task[0]}</a></td>
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
                    <td key={sol[0]}><a href={IPFSEXPLORER + sol[0]}>{sol[0]}</a></td>
                    <td key={sol[1]}><a href={IPFSEXPLORER + sol[1]}>{sol[1]}</a></td>
                    <td key={sol[2]}><a href={TEXPACC + task[0]}>{sol[2]}</a></td>
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
        if (Object.keys(this.state.thetaWallet).length <= 0) {
            return;
        }

        return (
            <React.Fragment>
            <h2> Add Task </h2>
            <form onSubmit={this.taskSubmit} className="styleform">
                <label>TFuel for Task:</label>
                <div className="clear"></div>
                <input type="text" id="taskValue" placeholder="Task TFuel value" minLength="1" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <br/>
                <label>IPFS Hash:</label>
                <div className="clear"></div>
                <input type="text" id="taskHash" placeholder="Task Hash" minLength="5" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <div className="clear"></div>
                <input type='submit' value="Submit" id="taskSubmitButton" />
            </form>
            </React.Fragment>
        );
    }

    addSolutionTaskProp = () => {
        if (this.state.taskList.length <= 0) {
            return;
        }

        return (
            <React.Fragment>
            <h2> Add Solution to task </h2>
            <form onSubmit={this.solutionSubmit} className="styleform">
                <label>Task:</label>
                <div className="clear"></div>
                <input type="text" id="solutionTask" placeholder="Task hash" minLength="5" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <br/>
                <label>Solution IPFS Hash:</label>
                <div className="clear"></div>
                <input type="text" id="solutionHash" placeholder="Solution Hash" minLength="5" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <div className="clear"></div>
                <input type='submit' value="Submit" id="solutionSubmitButton"/>
            </form>
            </React.Fragment>
        )
    }

    markTaskSolvedProp = () => {
        if (this.state.solutionList.length <= 0) {
            return;
        }

        return (
            <React.Fragment>
            <h2> Mark task as solved </h2>
            <form onSubmit={this.taskSolvedSubmit} className="styleform">
                <label>Task solution:</label>
                <div className="clear"></div>
                <input type="text" id="taskSolution" placeholder="Task Solution" minLength="5" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <div className="clear"></div>
                <label>Task Hash:</label>
                <div className="clear"></div>
                <input type="text" id="taskHashSolution" placeholder="Task Hash" minLength="5" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <div className="clear"></div>
                <input type='submit' value="Submit" id="taskSolvedSubmitButton"/>
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
            <form onSubmit={this.thetaPrivKeySubmitEvent} className="styleform">
                <input type="text" id="thetaAccountPrivKey" placeholder="Private Key"
                    minLength="10" onKeyDown={this.handleKeyDown} onChange={this.handleFormChange} />
                <div className="clear"></div>
                <input type='submit' value="Submit" />
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
        const accExplorer = TEXPACC + thetaWallet.address;
        return (
            <React.Fragment>
            <h2>Theta account</h2>
            <p>Account: <b><a href={accExplorer}>{thetaWallet.address}</a></b></p>
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

    handleFormChange = e =>
    {
        this.setState({ [e.target.id]: e.target.value });
    }

    handleKeyDown = e =>
    {
        // if the enter key is pressed, call the contract action
        if (e.keyCode === 13)
        {
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
                    break;
                default: break;
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
        var button = document.getElementById('taskSubmitButton');
        if (button.disabled === true) {
            return
        }

        const taskHash = this.state.taskHash;
        const taskValue = thetajs.utils.toWei(this.state.taskValue);

        if (taskHash.length <= 5) {
            console.log("Error at taskSubmit with taskHash", taskHash);
            button.disabled = false;
            return;
        }

        if (isNaN(taskValue)) {
            console.log("Error at taskSubmit with taskValue", taskValue);
            button.disabled = false;
            return;
        }

        const contract = this.state.contract;
        const overrides = {
            value: taskValue // tfuelWei to send
        };

        button.disabled = true;
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

        button.disabled = false;
    }

    solutionSubmit = async (event) =>
    {
        event.preventDefault();

        var button = document.getElementById('solutionSubmitButton');
        if (button.disabled === true) {
            return
        }

        const solutionTask = this.state.solutionTask;
        const solutionHash = this.state.solutionHash;
        const contract = this.state.contract;

        if (solutionTask.length <= 5 || solutionHash.length <= 5) {
            console.log("Error at solutionSubmit with solution", solutionTask, solutionHash);
            button.disabled = false;
            return;
        }
        button.disabled = true;
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

        button.disabled = false;
    }

    taskSolvedSubmit = async (event) =>
    {
        event.preventDefault();

        var button = document.getElementById('taskSolvedSubmitButton');
        if (button.disabled === true) {
            return
        }

        const taskSolution = this.state.taskSolution;
        const taskHashSolution = this.state.taskHashSolution;
        const contract = this.state.contract;

        if (taskSolution.length <= 5 || taskHashSolution.length <= 5) {
            console.log("Error at taskSolvedSubmit with task", taskSolution, taskHashSolution);
            button.disabled = false;
            return;
        }

        console.log("Task Solved submit", taskHashSolution, taskSolution);
        button.disabled = true;
        try {
            const res = await contract.markTaskSolved(taskHashSolution, taskSolution)
            console.log("Hash of task solved:", res)
            setTimeout(()=>{this.loadContractData((this.state.thetaWallet))}, 1000);
        } catch (e)
        {
            console.log('Failed task solved submission:', e);
        }

        button.disabled = false;
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
        const scAddress = TEXPACC + CONTRACTADDRESS;
        return (
        <div className="App">
            <br/>
            <br/>
            <br/>
            <ToastContainer />
            <div>
                <img src={logo} alt="Hackaton-Logo" />
                <h1>Theta Edge Marketplace with Neural Networks</h1>
                <p>
                Employ the Theta Network to deploy computations using edge nodes
                and providing bounties for their results.
                </p>
                <p>
                Smart contract address: <a href={scAddress}><b>{CONTRACTADDRESS}</b></a>
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
            <br/>
            <br/>
            <br/>
        </div>
    ); }
}

export default DComponent;
