#!/bin/sh

bin="../bin/examples"


mkdir -p "$bin"
# rm "$bin/*" # todo...

for file in *
do
  if [ -d $file ]
  then
    echo "packaging $file..."
    exclude_files="*.gitignore *gwt-unitCache* *appengine-* *datanucleus-* *geronimo-* *jdo2-* *jsr107cache-* *gwt-servlet* */deploy/* */classes/*"
    zip -q -r "$bin/$file.zip" "$file" -x $exclude_files
  fi
done
