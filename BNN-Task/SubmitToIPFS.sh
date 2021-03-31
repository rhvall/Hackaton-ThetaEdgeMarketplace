#!/bin/bash

#  Theta Edge Marketplace
#
#  Created by RHVT on 01/Mar/2021.
#  Copyright © 2021 R. All rights reserved.
#
# //////////////////////////////////////////////////////////
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, version 3 or later.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.
# //////////////////////////////////////////////////////////

TARFILE="ThetaResult.tar.gz"
[[ ! -f $TARFILE ]] && echo "$1 does not exist, script will finish" && exit 1;
command -v ipfs >/dev/null 2>&1 || { echo >&2 "IPFS program required to submit a task. Install and try again."; exit 1 }
IPFSDAEMON=$(ps ax | grep "i[p]fs daemon")
[[ -z $IPFSDAEMON ]] && echo "IPFS Daemon not running, execute ´ipfs daemon´ and run again. Exit now" && exit 1
HASH=$(ipfs add $TARFILE -q)
echo "Submit IPFS ID: $HASH to the Theta Smart contract"
