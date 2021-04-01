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

import { toast } from 'react-toastify'
import { generateStore, EventActions } from '@drizzle/store'
import DistributedTask from "../contracts/DistributedTask.json";

const drizzleOptions = {
  web3: {
    block: false,
    fallback: {
      type: "ws",
      url: "ws://127.0.0.1:9545",
    },
  },
  contracts: [
      DistributedTask
  ],
  events: {
    DistributedTask: ["CommitTask", "CommitSolution", "MarkSolutionAsSolved"],
  },
  polls: {
    // set polling interval to 30secs so we don't get buried in poll events
    accounts: 30000,
  },
};

const contractEventNotifier = store => next => action => {
    if (action.type === EventActions.EVENT_FIRED) {
        console.log("Notification Action", action);
        const contract = action.name;
        const contractEvent = action.event.event;
        // const message = action.event.returnValues._message
        const message = "Block mined";
        const display = `${contract}(${contractEvent}): ${message}`;

        toast.success(display, { position: toast.POSITION.TOP_RIGHT });
    }

    return next(action)
}

const appMiddlewares = [ contractEventNotifier ]

const drizzleStore = generateStore({
    drizzleOptions,
    appMiddlewares,
    disableReduxDevTools: false
})

// const drizzleInstance = new Drizzle(drizzleStore);

const drizzleProv = {
    // drizzleInstance,
    drizzleOptions,
    drizzleStore,
};

export default drizzleProv;
