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

// SPDX-License-Identifier: GFDL-1.3-or-later
// pragma solidity ^0.7.1;
pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;


contract DistributedTask {
    struct Task {
        address taskInitiator;
        string hash;
        uint reward;
        address solver;
    }

    struct Solution {
        string taskHash;
        string solutionHash;
        address payable solver;
    }

    uint constant MIN_COLLATERAL = 10000000;
    mapping(string => Task) public taskMap;
    mapping(string => Solution[]) public solutionMap;
    string[] public taskList;


    event CommitTask(string taskHash, uint rewardAmount);
    event CommitSolution(string taskHash, string solutionHash, address solver);
    event MarkSolutionAsSolved(string taskHash, string validSolutionHash, address solver);

    function commitTaskHash(string memory taskHash) public payable {
        // Disincentivize malicious Task Initiators
        require(msg.value >= MIN_COLLATERAL, "Task does not have enough collateral");
        require(bytes(taskMap[taskHash].hash).length == 0, "the task is already registered");
        require(bytes(taskHash).length > 0, "the task hash must be larger than 0");

        // Record the task on the blockchain
        taskMap[taskHash] = Task({
            taskInitiator: msg.sender,
            hash: taskHash,
            // msg.value amount of TFuel will be automatically transfer to the contract solver: address(0x0)
            reward: msg.value,
            solver: address(0x0)
        });
        taskList.push(taskHash);
        emit CommitTask(taskHash, msg.value);
    }

    function commitSolutionHash(string memory taskHash, string memory solutionHash) public {
        require(taskMap[taskHash].solver == address(0x0), "the task has been marked as solved");
        solutionMap[taskHash].push(Solution({
            taskHash: taskHash,
            solutionHash: solutionHash,
            solver: msg.sender
        }));

        emit CommitSolution(taskHash, solutionHash, msg.sender);
    }

    function markTaskSolved(string memory taskHash, string memory validSolutionHash) public returns (bool) {
        require(msg.sender == taskMap[taskHash].taskInitiator, "only the task initiator can mark the task as solved");
        require(compareStrings(taskMap[taskHash].hash, taskHash) == true, "incorrect task");
        require(taskMap[taskHash].solver == address(0x0), "the task has been marked as solved");

        Solution[] memory solutions = solutionMap[taskHash];
        for (uint i = 0; i < solutions.length; i++) {
            Solution memory solution = solutions[i];
            if (compareStrings(solution.solutionHash, validSolutionHash)) {
            // found the first solver that committed the valid solution
                address solver = solution.solver;
                taskMap[taskHash].solver = solver; // mark the task as solved
                uint reward = taskMap[taskHash].reward;
                taskMap[taskHash].reward = 0;
                solution.solver.transfer(reward); // transfer the TFUEL reward to the solver

                for (uint j = 0; j < taskList.length; j++) {
                    if (compareStrings(taskList[j], taskHash)) {
                        removeTaskAtIndex(j);
                    }
                }

                emit MarkSolutionAsSolved(taskHash, validSolutionHash, solver);
                return true;
            }
        }

        return false;
    }

    function retrieveTaskList() public view returns(string[] memory) {
        return taskList;
    }

    function activeTasks() public view returns(uint256) {
        return taskList.length;
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function removeTaskAtIndex(uint index) internal {
        uint tll = taskList.length;
        require(index < tll);
        taskList[index] = taskList[tll - 1];
        taskList.length--;
    }
}
