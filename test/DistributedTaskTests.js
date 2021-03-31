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

const DistributedTask = artifacts.require("./DistributedTask.sol");

contract("DistributedTask", accounts => {
    const empty = '0x0000000000000000000000000000000000000000'.valueOf();
    // const taskHash = '0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce'.valueOf();
    const taskHash = "bafybeiguzlisexandrqqcvidxtpjtid2acudavdebot6zdck5hcjguxc4i"
    // const solutionHash = '0x351185f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf464aa'.valueOf();
    const solutionHash = "QmXJNGZBy9265uzwTXdARRS2fc7xg6cMtCjnD6Cy1b11Ui"
    const acc0 = accounts[0];
    const acc1 = accounts[1];
    const taskValue = 100000000;

    it("should not register a task without value", async () =>
    {
        let err = null;
        const contractOS = await DistributedTask.deployed();

        try {
            await contractOS.commitTaskHash(taskHash, { from: acc0 });
        } catch (error) {
            err = error;
        }

        assert.ok(err instanceof Error);
    });

    it("should register a task", async () =>
    {
        const contractOS = await DistributedTask.deployed();

        await contractOS.commitTaskHash(taskHash, { from: acc0, value: taskValue });

        const storedTask = await contractOS.taskMap.call(taskHash);

        assert.equal(storedTask.hash, taskHash, "The task hash was not stored");
        assert.equal(storedTask.taskInitiator, acc0, "The task initiator is not correct");
        assert.equal(storedTask.solver, empty, "The task solver is not correct");
    });

    it("should commit a solution hash", async () =>
    {
        const contractOS = await DistributedTask.deployed();

        await contractOS.commitSolutionHash(taskHash, solutionHash, { from: acc1 });

        const solveMap = await contractOS.solutionMap.call(taskHash, 0);

        assert.equal(solveMap.taskHash, taskHash, "The task hash was not stored in a solution map");
        assert.equal(solveMap.solutionHash, solutionHash, "The solution hash was not stored in a solution map");
        assert.equal(solveMap.solver, acc1, "The task solver is not correct");
    })

    it("should mark a task as solved", async () =>
    {
        const contractOS = await DistributedTask.deployed();

        const taskList0 = await contractOS.retrieveTaskList.call();

        assert(taskList0.length >= 1, "The taskList should have at least one hash stored");

        await contractOS.markTaskSolved(taskHash, solutionHash, { from: acc0 });

        const storedTask = await contractOS.taskMap.call(taskHash);

        assert.equal(storedTask.hash, taskHash, "The task hash was not stored");
        assert.equal(storedTask.taskInitiator, acc0, "The task initiator is not correct");
        assert.equal(storedTask.solver, acc1, "The task solver is not correct");
        assert.equal(storedTask.reward, 0, "The task reward should be 0");

        const taskList1 = await contractOS.retrieveTaskList.call();
        assert.notEqual(taskList0, taskList1, "The taskList should have one hash less");
    })

    it("should have a task list empty", async () =>
    {
        const taskHash2 = "ccfybeiguzlisexandrqqcvidxtpjtid2acudavdebot6zdck5hcjguxc4i";
        const taskSol2 = "bafybeiguzlisexandrqqcvidxtpjtid2acudavdebot6zdck5hcjguxcjj";
        const taskHash3 = "dcfybeiguzlisexandrqqcvidxtpjtid2acudavdebot6zdck5hcjguxc4i";
        const taskSol3 = "dafybeiguzlisexandrqqcvidxtpjtid2acudavdebot6zdck5hcjguxcjj";
        const contractOS = await DistributedTask.deployed();

        const taskList0 = await contractOS.retrieveTaskList.call();

        assert(taskList0.length == 0, "The taskList should not have any hash stored");

        await contractOS.commitTaskHash(taskHash2, { from: acc0, value: taskValue });
        await contractOS.commitTaskHash(taskHash3, { from: acc0, value: taskValue });
        await contractOS.commitSolutionHash(taskHash2, taskSol2, { from: acc1 });
        await contractOS.commitSolutionHash(taskHash3, taskSol3, { from: acc1 });
        await contractOS.markTaskSolved(taskHash2, taskSol2, { from: acc0 });
        await contractOS.markTaskSolved(taskHash3, taskSol3, { from: acc0 });

        const taskList1 = await contractOS.retrieveTaskList.call();

        assert(taskList1.length == 0, "The taskList should not have any hash stored");
    })
});
