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


## Helper functions to check files and folders
checkFile() {
    if [[ ! -f "$1" ]]; then
        echo "$1 does not exist, script will finish"
        exit 1
    fi
}

checkFolder() {
    if [[ ! -d "$1" ]]; then
        echo "$1 does not exist, script will finish"
        exit 1
    fi
}

removeNegative() {
    echo ${1#-}
}

getBestScore() {
    ARR=$@
    BEST=()
    for LINE in ${ARR[@]}; do
        ELEMS=($(echo $LINE | tr ',' '\n'))
        # With the first, it needs to set BEST
        [[ -z $BEST ]] && BEST=(${ELEMS[@]})
        # This will check the decryption quality the higher, the better (max 100)
        FST=$(removeNegative ${BEST[3]})
        SND=$(removeNegative ${ELEMS[3]})
        RES=$(awk -v f=$FST -v s=$SND 'BEGIN {print f <= s}')
        if [[ $RES -eq 1 ]]; then
            # This will check the NCC quality the lower, the better (min 0)
            FST=$(removeNegative ${BEST[1]})
            SND=$(removeNegative ${ELEMS[1]})
            RES=$(echo "$FST > $SND" | bc)
            if [[ $RES -eq 1 ]]; then
                BEST=(${ELEMS[@]})
            fi
        fi
    done
    echo ${BEST[@]}
}

## Set environment variables
TESTFOLDER="TestCases/"
TESTRESFOLDER=$TESTFOLDER"Result"
TXTFILE="Result.txt"
SUMTXT=$TESTFOLDER"Summary.txt"
OUTFILE="ThetaResult.tar.gz"

## Check files
checkFolder $TESTRESFOLDER

RESFILES=($(find $TESTRESFOLDER -type f -name $TXTFILE))

if [[ ${#RESFILES[@]} -lt 1 ]]; then
    echo "Not enough $TXTFILE files, re-run this script after getting those files with script RunTestCases.sh"
    exit 1
fi

rm -rf $SUMTXT
echo "Agent,NCC-AB,NCC-Alice-Original,NCC-Bob-Original,AliceOut,BobOut,ResultFile,MD5" >> $SUMTXT

for ELEM in ${RESFILES[@]}; do
    HASH=$(openssl dgst -sha256 $ELEM | awk '{print $2}')
    TAILLINES=$(tail -n +4 $ELEM)
    TAILEDCOUNT=$(echo $TAILLINES | tr ' ' '\n' | wc -l)
    HEADLINES=$(( TAILEDCOUNT - 2 ))
    CSV=($(echo $TAILLINES | head -n $HEADLINES))
    BEST=$(getBestScore ${CSV[@]})
    CCSV=$(echo $BEST | tr " " ",")
    echo "$CCSV,$ELEM,$HASH" >> $SUMTXT
done

tar zcf $OUTFILE *dat TestCases
echo "$OUTFILE created"
