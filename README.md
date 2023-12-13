# lite lingo extension
Getting Started:
To use this extension we have to follow these steps

Load the extension:
1. Clone this repo on your local drive
2. Go to chrome://extensions/
3. Turn on "Developer mode"
4. Click on "Load Unpacked"
5. Select the folder containing the json file.

Setup the server:

In the top directory directory terminal:
1. cd server
2. run command: "npm install"
3. If its your first time using it make sure you have postgres install, in index.js, provide your OpenAI key and insert your database connection settings.
4. run command: "nodemon" or "npm index.js"

Server should be up and check the console if not.

Now to use it.
1. make sure it is in the extensions list
2. right click on any text and select explain this text for plain text translation.
3. see results in the extensions popup, which is done by clicking Lite Lingo in the extension toolbar
4. on any highlighted text, you can highlight it again, and select "Select this translation" to quickly see all translations as well.
