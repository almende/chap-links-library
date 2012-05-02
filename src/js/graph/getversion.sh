#!/bin/sh
# Retrieve the version number from a javascript file
#
# The script searches for the following pattern:
#    @version x
# and returns x (the version numbers). If not found, "x.x.x" is returned


if [ $# != 1 ]
then
  echo "Error: one argument with file name expected"
  exit
fi

version_line=`grep -h "@version" "$1"`
version_identifier="@version"

version=""
identifier_found=0
for word in $version_line
do
  # check if this word is the version identifier
  if [ $word = $version_identifier ]
  then
    identifier_found=1
  else 
    # check if previous word was the version identifier
    if [ $identifier_found = 1 ]
    then
      version=$word
      identifier_found=0
    fi
  fi
done

$empty
if [ "$version" = "$empty" ]
then
  version="x.x.x"
fi 

echo "$version"
