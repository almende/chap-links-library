#!/bin/sh

unpack_path=".."

for file in *.zip
do
  parts=$(echo $file | tr '.' ' ')
  first=1
  for part in $parts
  do
    if [ $first = 1 ]
    then
      first=0
      
      # unzip this file
      dest="$unpack_path/$part"
      mkdir -p "$dest"
      echo "unpacking $file to $dest"
      rm -rf $dest
      unzip -q "$file" -d $dest
    fi
  done
done
