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

## Check the Operative System
UNAMESTR=`uname`
BISUNAEXE="BiSUNA-$UNAMESTR"
# if [[ "$UNAMESTR" == "Linux" ]]; then
#     BISUNAEXE+="Linux"
#     echo "Using Linux executable: "$BISUNAEXE
# elif [[ "$UNAMESTR" == "Darwin" ]]; then
#     BISUNAEXE+="MacOS"
#     echo "Using MacOS executable: "$BISUNAEXE
# elif [[ "$UNAMESTR" == "cygwin" ]]; then
#         # POSIX compatibility layer and Linux environment emulation for Windows
# elif [[ "$UNAMESTR" == "msys" ]]; then
#         # Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
# elif [[ "$UNAMESTR" == "win32" ]]; then
#         # I'm not sure this can happen.
# elif [[ "$UNAMESTR" == "freebsd"* ]]; then
#         # ...
# else
#     echo "$UNAMESTR OS not supported, use Linux or MacOS"
#     exit
# fi

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

checkFile $BISUNAEXE

## Set environment variables
TESTFOLDER="TestCases/"
TESTRESFOLDER=$TESTFOLDER"Result/"
ALICE=($(ls alicesCPAbisunaGen100000*)) ## In case there are many files, only take the first
BOB=($(ls bobsCPAbisunaGen100000*))     ## for that reason it is transformed as an array
INIFILE="GenerateTestCases.ini"

## Check files
checkFolder $TESTFOLDER
checkFile $ALICE
checkFile $BOB
checkFile $INIFILE

## Create output folder
mkdir -p $TESTRESFOLDER
## $PROJECT_DIR/resources/DistributedPopulationCPA.ini

## Set environment variables
INIFILEPATTERN="<INI-FILE>"
INFILE="<IN-FILE>"
OUTFOLDER="<OUT-FOLDER>"
OUTFILE="<OUT-FILE>"
ISBMP="<IS-BMP>"
AFILE="<ALICE-FILE>"
BFILE="<BOB-FILE>"

## Read which files are inside TESTFOLDER, which are part of the verification
for ELEM in $TESTFOLDER*; do
    BMP="false" ## Special consideration for BMP files
    if [[ -f $ELEM ]]; then
        EXTENSION=${ELEM##*.}
        FILENAME=${ELEM##*/}
        FNAME=${FILENAME%%.*}
        FFOLDER=$TESTRESFOLDER$FNAME"/"
        mkdir -p $FFOLDER ## Make a folder to place all the results
        [[ $EXTENSION == "bmp" ]] && BMP="true"
        LOCALINI=$FFOLDER$INIFILE ## Create a name for the ini file
        RESNAME=$FNAME"-Result."$EXTENSION ## Then name for the output file
        cat $INIFILE | sed -e "s#$INIFILEPATTERN#$LOCALINI#g" \
            -e "s#$INFILE#$ELEM#g" \
            -e "s#$OUTFOLDER#$FFOLDER#g" \
            -e "s#$OUTFILE#$RESNAME#g" \
            -e "s#$ISBMP#$BMP#g" \
            -e "s#$AFILE#$ALICE#g" \
            -e "s#$BFILE#$BOB#g" > $LOCALINI
        ./$BISUNAEXE $LOCALINI > $FFOLDER"Result.txt"
        echo echo "Finished $FILENAME tests"
    fi
done
