#!/bin/sh
# read current directoy and output directories, files, and file sizes as JSON
#
# usage: 
#   sh readdir.sh [pattern]
# example:
#   sh readdir.sh
#   sh readdir.sh *.pdf


# define file pattern
pattern="*"
if [ $# -ge 1 ]
then
  pattern=$1
fi


readdir() {
  echo -n "{"
  first=1
  
  # loop through files
  for d in $pattern
  do
    if [ -f "$d" ]; then
      if [ $first = 1 ]
      then
        first=0
      else
        echo -n ","
      fi

      echo -n "\"$d\":"

      # read file size
      size=0
      size=$(stat -c%s "$d")
      echo -n $size
    fi
  done

  
  # read directories
  for d in *
  do
    if [ -d "$d" ]; then
      if [ $first = 1 ]
      then
        first=0
      else
        echo -n ","
      fi

      echo -n "\"$d\":"
      # recurse into directory
      (cd "$d"; readdir)
    fi
  done  

  echo -n "}"
}

readdir
