How to release CHAP Links Library

This page describes the steps required to built packages for the visualization components, and deploy them on the github pages of the project.

Replace the name **Component** in the deployment steps for the name of the component that is being deployed (Timeline, Graph, Network, etc).

# Javascript

The Javascript version of Component is located at js/src/component

- Open the javascript project in a Javascript IDE
  - Update @date in the header of component.js
  - Update @version in the header of component.js
  - Open CHANGELOG and add a new section for the new version. Write down the main changes.
  - Ensure the documentation under component/doc is updated according to the changes
- Open a console

  - Go to js/src/component
  - Run `sh package.sh`

  This will update the JsDoc, minify the code, package the code into component.zip, 
  and copy the package to js/bin.

# Google Web Toolkit

The Google Web Toolkit (GWT) version of Component is located at gwt/src/component

- Open the project of Component in Eclipse
  - Copy the updated javascript files into the GWT project under com/chap/links/public and refresh the project.
  - Update the @date in the header of the file .com.chap.links.Component.java
  - Ensure the GWT version is adjusted to the changes in the Javascript version of Component.
- Open a console

  - Go to gwt/src/Component
  - Run `sh package.sh`

  This will generate javadoc, create a jar file, package it into chap-links-component.zip, and copy the package to gwt/bin.

- TODO: examples must also be updated


# Github pages

- Copy the Javascript package component.zip from js/bin to the github pages project under js/files.
- Open a console

  - Go to js/files
  - Run `sh unpack.sh`

  This will unpack the Javascript package for online usage of examples and documentation.

- Copy the new GWT package gwt-links-component.zip to the github pages project under gwt/files.
- Open a console

  - Go to gwt/files
  - Run `sh unpack.sh`

  This will unpack the GWT package for online usage of examples and documentation.

- Open a console

  - Go to /
  - Run `sh savefilesmap.sh`
  
  This will update the file files.json containing the site map.

- Commit and push the gh-pages project to Github.
