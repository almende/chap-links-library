#!/bin/sh
# 
# - create jar
# - generate javadoc
# - create zipfile containing jar and docs

path=`pwd`
name=`basename $path | tr '[A-Z]' '[a-z]'`

jar="bin/gwt-links-$name.jar"
zip="gwt-links-$name.zip"
bin="../../bin"
package="$bin/$zip"
files="bin doc README LICENSE NOTICE"
exclude_files="*/.gitignore"

# create jar
echo "creating jar..."
ant

# generate javadoc
echo "generating javadoc..."
ant -f build_javadoc.xml

# create zip file
echo "zipping $jar into $package..."
mkdir -p "$bin"
zip -r -q $package $files -x $exclude_files
