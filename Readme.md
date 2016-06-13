# MTViewCenter2

MTViewCenter2 is a Framework project with it's main purpose in Representing a Common Interface for flexible managment of Manufacturing Processes.
It is created to introduce a Web Based 3D Visualisation of underground mining map and logical infrastructure interface.

The Focus is on :

  - strong Modularization
  - runtime Flexibility
  - efficient Data Managment
  - hight Performance

The Framework can be used to either simply create Custom Web Applications for the Browser, or as an extention, having data boundry to Business logic peers. The starting point for the user is to write his own plugins.
The core mainly takes care about the user following common Design Patterns ( e.g. Pub/Sub ).

### Current Version

2.1.5

### Tech

MTViewCenter2 uses a number of open source projects to work properly :

* [AngularJS] - HTML enhanced for web apps!
* [Node.js] - evented I/O for the backend
* [Express] - fast node.js network app framework
* [Grunt] - the streaming build system
* [Twitter Bootstrap] - great UI boilerplate for modern web apps
* [Jasmine] - the Testing environment

And of course MTViewCenter2 itself is open source with a [public repository] on GitHub.

### Installation

First clone (or Download and extract) the Repository and go to the Directory.
```sh
$ git clone https://github.com/MineTronics/MTViewCenter2 MTViewCenter2
$ cd MTViewCenter2
```

Once you cloned the Repository you can setup Environment tools via :  
( for Linux / Unix )
```sh
$ ./install_node_env.sh
```

easily make a first testrun
```sh
node scripts/install_dep.js vc2_core/default_config.js
```
or alternatively (this will not install plugins dependencies)

```sh
$ npm install
$ bower install
```
after that
```sh
$ grunt prod
$ grunt run
```

### Development

Want to contribute in Project ?

for MTViewCenter you can simply copy the skeleton in the [plugins_opensource] Dir and create your own Plugin.
Make a change in the files and write some Tests.

First Tab:
```sh
$ grunt dev
```

Second Tab:
```sh
$ grunt watch
```

(optional for Testing) Third:
```sh
$ grunt jasmine
```

Finally you can branch your changes on Github and/or make a pull Request.

### Todos

 - write Windows Setup Scripts
 - Write Tests
 - extend Templating
 - Add Code Comments

License
----

AGPLv3


**Open Software does its Job !**

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. See  http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [MineTronics]: <http://www.minetronics.com>
   [public repository]: <https://github.com/MineTronics/MTViewCenter2>
   [plugins_opensource]:<https://github.com/MineTronics/MTViewCenter2/tree/master/plugins_opensource>
   [Grunt]: <http://gruntjs.com/>
   [Jasmine]: <http://jasmine.github.io/>
   [node.js]: <http://nodejs.org>
   [express]: <http://expressjs.com>
   [AngularJS]: <http://angularjs.org>
   [Twitter Bootstrap]: <http://getbootstrap.com/>
   [Grunt]: <http://gruntjs.com>
   [AGPLv3]: <https://github.com/MineTronics/MTViewCenter2/blob/master/LICENSE>
