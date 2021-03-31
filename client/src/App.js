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
