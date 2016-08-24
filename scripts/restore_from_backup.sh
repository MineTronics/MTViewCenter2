#!/bin/bash
FILE=$1
BACKUP="temp_$FILE"
if [ -f $BACKUP ];
then
   echo "Restoring $1"
   cp $BACKUP $FILE
   rm $BACKUP
fi