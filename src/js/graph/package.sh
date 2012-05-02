#!/bin/sh
# 
# This script:
# - updates javascript documentation
# - generates a minified version of the javascript
# - creates a zip file containing the code, minified code, docs, and examples
# - copies the package to the bin directory

path=`pwd`
name=`basename $path`
files="*"
exclude_files="*.sh tests"
bin="../../../bin"
tools="../../../tools"

source="${name}.js"
source_min="${name}-min.js"
version=`sh getversion.sh $source`
package="${name}-${version}.zip"
path_dest="${bin}/js"
path_dest_prev="${path_dest}/previous"
path_package="${path_dest}/${package}"
jsdoc_toolkit="${tools}/jsdoc-toolkit"
jsdoc_dest="doc/jsdoc"


# update the javascript documentation
echo "generate jsdoc..."
mkdir -p $jsdoc_dest
java -jar $jsdoc_toolkit/jsrun.jar $jsdoc_toolkit/app/run.js -a -t=$jsdoc_toolkit/templates/jsdoc $source -d=$jsdoc_dest

# generate minified code
echo "generate minified version of javascript..."
java -jar $tools/compiler.jar --js $name.js --js_output_file $source_min

# move current package to the folder with previous packages
echo "move previous version of the package..."
mkdir -p $path_dest
mkdir -p $path_dest_prev
mv $path_dest/$name* $path_dest_prev

# create package
echo "create package ${package}..."
zip -q -r $path_package $files -x $exclude_files
cp $path_package $path_dest_prev
