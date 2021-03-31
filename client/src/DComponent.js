import React, { Component } from "react";
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { drizzleConnect } from "@drizzle/react-plugin";
import PropTypes from 'prop-types'
import
{
    ContractData,
    AccountData,
    ContractForm
} from "@drizzle/react-components";
import logo from "./images/ThetaHackaton.png";

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001,
                        protocol: "https", apiPath:'/api/v0' });

class DComponent extends Component
{
    constructor(props, context)
    {
        // const taskHash = '0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce'.valueOf();
        // const solutionHash = '0x351185f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf464aa'.valueOf();
        // IPFS = bafybeiguzlisexandrqqcvidxtpjtid2acudavdebot6zdck5hcjguxc4i
        // 1 ETH = 1000000000000000000 Wei
        super(props);
        console.log("Constructor: ", props);
        console.log("Context: ", context);
        this.state = {
            contract: context.drizzle.contracts.DistributedTask,
            account: props.accounts[0],
            fileBuffer: null,
            fileHash: "Qmdaw5ZUeZ484N9FfgQDHM57XeTw2MuCTjPdDpUGBvk1KV",
            taskHash: "",
            taskValue: 0,
            solutionTask: "",
            solutionHash: "",
            taskList: []
        };
    }

    async componentWillMount()
    {
        this.loadBlockChainData();
    }

    loadBlockChainData = async () =>
    {
        console.log("Contract: ", this.state.contract);
        const taskListMethod = this.state.contract.methods.retrieveTaskList();
        taskListMethod.call((err, res) =>
        {
            if (err) {
                console.log("Error when occured", err);
                return
            }

            console.log("Active Tasks: ", res);
            this.setState({
                taskList: res
            });
        }
        );

        // if (Object.keys(taskMap).length !== 0) {
        //     tasks = taskMap.map((task) =>
        //         <li>{task}</li>
        //     );
        // }
        // console.log("Tasks:", tasks);
    }

    taskListProp = tasks => {
        if (tasks.length > 0) {
            return (
                <React.Fragment>
                <h2> Task List </h2>
                <ul>
                    {
                        tasks.map((task) =>
                            <li key={task}>{task}</li>
                        )
                    }
                </ul>
                </React.Fragment>
            );
        }
    }

    handleFormChange = e => {
        this.setState({ [e.target.id]: e.target.value });
    }

    handleKeyDown = e => {
        // if the enter key is pressed, call the contract action
        if (e.keyCode === 13) {
            const taskValue = this.state.taskValue;
            const taskHash = this.state.taskHash;

            if (taskValue <= 0) {
                console.log("Task value should be greater than 0");
                return;
            }

            if (taskHash.length <= 3) {
                console.log("Task hash should be greater than 3 characters");
                return;
            }

            this.taskSubmit(e);
        }
    };

    captureFile = (event) =>
    {
        event.preventDefault();
        const file = event.target.files[0];
        const reader = new window.FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend= () => {
            this.setState({ fileBuffer: Buffer(reader.result) });
        }
    }

    taskSubmit = async (event) =>
    {
        event.preventDefault();
        const taskHash = this.state.taskHash;
        const taskValue = this.state.taskValue;
        const acc0 = this.state.account;
        console.log("TaskHash:", taskHash);
        console.log("TaskValue:", taskValue);
        try {
            this.state.contract.methods.commitTaskHash(taskHash).send
            ({ from: acc0, value: taskValue }, (err, res) =>
            {
                if (err) {
                    console.log("An error occured", err)
                    return
                }
                    console.log("Hash of the transaction: " + res)
                }
            );
        } catch (e)
        {
            console.log('Failed task submission:', e);
        }
    }

    solutionSubmit = async (event) =>
    {
        event.preventDefault();
        const solutionTask = this.state.solutionTask;
        const solutionHash = this.state.solutionHash;
        const acc0 = this.state.account;
        console.log("solutionTask:", solutionTask);
        console.log("solutionHash:", solutionHash);
        try {
            this.state.contract.methods.commitSolutionHash(solutionTask, solutionHash).send
            ({ from: acc0 }, (err, res) =>
            {
                if (err) {
                    console.log("An error occured", err)
                    return
                }
                    console.log("Hash of the solution transaction: " + res)
                }
            );
        } catch (e)
        {
            console.log('Failed task submission:', e);
        }
    }

    taskSolvedSubmit = async (event) =>
    {
        event.preventDefault();
        const taskSolution = this.state.taskSolution;
        const taskHashSolution = this.state.taskHashSolution;
        const acc0 = this.state.account;
        console.log("taskHashSolution:", taskSolution);
        console.log("taskHashSolution:", taskHashSolution);
        try {
            this.state.contract.methods.markTaskSolved(taskHashSolution, taskSolution).send
            ({ from: acc0 }, (err, res) =>
            {
                if (err) {
                    console.log("An error occured", err)
                    return
                }
                    console.log("Hash of the solution transaction: " + res)
                }
            );
        } catch (e)
        {
            console.log('Failed task submission:', e);
        }
    }

// QmXJNGZBy9265uzwTXdARRS2fc7xg6cMtCjnD6Cy1b11Ui
    fileSubmit = async (event) =>
    {
        event.preventDefault();
        console.log("File to be submitted...");
        console.log("Buffer:", this.state.fileBuffer);
        const fileAddRes = await ipfs.add(this.state.fileBuffer);
        console.log(fileAddRes);
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
                <h1>Theta Edge Compute Market with Neural Networks</h1>
                <p>Employ the Theta Network to deploy computations using edge nodes
                and providing bounties to their results.
                </p>
            </div>

            <div>
                <nav className="navbar">
                    <h5> Account: </h5>
                    <AccountData accountIndex={0} units={"ether"} precision={2} />
                </nav>
            </div>

            <div className="section">
                <h2>DistributedTask with event</h2>
                <p>Change the value to invoke a contract event</p>
                <p>
                    <strong>Stored Value: </strong>
                </p>
            </div>

            <div>
                <h2>Change meme</h2>
                <div>
                    <img alt="Img File" src={`https://ipfs.infura.io/ipfs/${this.state.fileHash}`} />
                </div>
                <form onSubmit={this.fileSubmit} >
                    <input type="file" onChange={this.captureFile} />
                    <input type='submit' />
                </form>
            </div>
            <div>
                { this.taskListProp(this.state.taskList) }
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
