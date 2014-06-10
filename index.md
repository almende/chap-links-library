---
layout: default
title: Overview
---

# CHAP Links Library

CHAP Links Library is a web based visualization library for displaying graphs, 
networks, and timelines. 
The tools are developed as 
[Google Visualization Charts](https://developers.google.com/chart/interactive/docs/gallery) 
for Javascript and GWT. 
CHAP Links Library is developed by [Almende](http://almende.com) as part of 
[CHAP](http://chap.almende.com), the Common Hybrid Agent Platform.

This site contains documentation, downloads and live examples of the CHAP Links Library.
The [Google Group CHAP Links Library](https://groups.google.com/d/forum/chap-links-library)
can be used to ask questions and share ideas.
Sourcecode can be found at the 
[Github project chap-links-library](https://github.com/almende/chap-links-library).
Issues and feature requests can be submitted via the Github project too.

CHAP Links Library is open source and licensed under the
[Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).

The library contains the following components:

<table width="100%">
  <tr>
    <th>
      <a href="graph.html">
        Graph<br>
        <img src="js/graph/doc/graph120x60.png" class="thumb">
      </a>
    </th>
    <th>
      <a href="graph3d.html">
        Graph3d<br>
        <img src="js/graph3d/doc/graph3d120x60.png" class="thumb">
      </a>
    </th>
    <th>
      <a href="network.html">
        Network<br>
        <img src="js/network/doc/network120x60.png" class="thumb">
      </a>
    </th>
    <th>
      <a href="timeline.html">
        Timeline<br>
        <img src="js/timeline/doc/timeline120x60.png" class="thumb">
      </a>
    </th>
    <th>
      <a href="treegrid.html">
        TreeGrid<br>
        <img src="js/treegrid/doc/treegrid120x60.png" class="thumb">
      </a>
    </th>
  </tr>
</table>


## Successor

<img src="http://visjs.org/img/logo/vis128.png" style="align: left; padding-right: 10px;">
CHAP Links Library now has a successor, [vis.js](http://visjs.org).
The limitations of the architecture of CHAP Links Library have been reached, 
and it was time for a fresh start. Main differences are:

- Data is now based on JSON instead of a Google DataTable, and is key based  
  instead of row based. This makes dealing with dynamic data much easier. 
  Data can be manipulated via a DataSet, and one can listen for changes in the  
  data and synchronize these changes with a backend server.
- The Timeline is modularized. This makes it possible to customize and extend 
  the Timeline much further. The Timeline and Graph will be merged into a single 
  tool, and it will become easy to display more item types on the Timeline, 
  such as annotations.
- The code is modularized, making it easier to maintain and extend.

[Go to the website of vis.js](http://visjs.org)




<div style="height: 200px;"><br></div>
