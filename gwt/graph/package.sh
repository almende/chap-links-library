#!/bin/sh

# create a zipped file with jar and documentation
# copy the jar file to all example projects
# zip the example projects

name="graph";
jar="gwt-links-$name.jar"
files="../../files/gwt"
files_examples="$files/examples/"
files_src="$files/src/"
examples="examples/*"
sources="src/*"
package="gwt-links-$name.zip"
package_dest="$files/gwt-links-$name.zip"
package_dest_prev="$files/previous_versions/gwt-links-$name-`date +%Y-%m-%d`.zip"
package_files="$jar LICENSE NOTICE README doc/*"
exclude_files="*/*.svn/*"

# create zip file
echo "zip $jar into $package"
zip -r -q $package $package_files -x $exclude_files
echo "copy $package to $package_dest"
cp $package $package_dest
echo "copy $package to $package_dest_prev"
cp $package $package_dest_prev

# create zip file for each of the examples
for file in $examples
do
  echo "copy $jar to ${file}/lib"
  cp $jar "${file}/lib"
  
  echo "copy $jar to ${file}/war/WEB-INF/lib"
  cp $jar "${file}/war/WEB-INF/lib"
  
  example="$file"
  examplezip="${files_examples}$(basename $file).zip"
  echo "delete $examplezip"
  rm $examplezip
  echo "zip $example into $examplezip"
  zip -r -q $examplezip $example -x $exclude_files 
done


echo "done"
