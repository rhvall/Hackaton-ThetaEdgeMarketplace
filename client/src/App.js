import React, { Component } from "react";
import { DrizzleProvider } from "@drizzle/react-plugin";
import { LoadingContainer } from "@drizzle/react-components";

import './App.css';

import drizzleProv from './middleware/drizzleProv';
import DContainer from "./DContainer";

class App extends Component {
    render() {
        return (
            <DrizzleProvider store={drizzleProv.drizzleStore} options={drizzleProv.drizzleOptions}>
                <LoadingContainer>
                    <DContainer />
                </LoadingContainer>
            </DrizzleProvider>
        );
    }
}

export default App;
