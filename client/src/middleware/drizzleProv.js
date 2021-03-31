import { toast } from 'react-toastify'
import { Drizzle, generateStore, EventActions } from '@drizzle/store'
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
    // SimpleStorage: ["StorageSet"],
  },
  polls: {
    // set polling interval to 30secs so we don't get buried in poll events
    accounts: 30000,
  },
};

const contractEventNotifier = store => next => action => {
    if (action.type === EventActions.EVENT_FIRED) {
        const contract = action.name
        const contractEvent = action.event.event
        const message = action.event.returnValues._message
        const display = `${contract}(${contractEvent}): ${message}`

        toast.success(display, { position: toast.POSITION.TOP_RIGHT })
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
