const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
//const drive ;= google.drive({version: 'v3',  oAuth2Client1});
//const drive = google.drive({version: 'v3'});
//var drive = google.drive("v3");




const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.photos.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), downloadfile);//File Download
    // authorize(JSON.parse(content), uploadFile);

});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
    const drive = google.drive({ version: 'v3', auth });
    drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        if (files.length) {
            console.log('Files:');
            files.map((file) => {
                console.log(`${file.name} (${file.id})`);
            });
        } else {
            console.log('No files found.');
        }
    });
}

function downloadfile(auth) {
    const drive = google.drive({ version: 'v3', auth });
    const fileId = '1VhCxrdf53aOsjDUa6zEBjoH2wlit0TuI';
    //   https://drive.google.com/file/d/1VhCxrdf53aOsjDUa6zEBjoH2wlit0TuI/view?usp=sharing
    const fileName = 'pleasegetdownloaded.jpg';
    const filePath = `./uploads/${fileName}`;
    const dest = fs.createWriteStream(filePath);
    let progress = 0;

    try {
        drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        ).then(res => {
            res.data
                .on('end', () => {
                    console.log('Done downloading file.');
                })
                .on('error', err => {
                    console.error('Error downloading file.');
                })
                .on('data', d => {
                    progress += d.length;
                    if (process.stdout.isTTY) {
                        process.stdout.clearLine();
                        process.stdout.cursorTo(0);
                        process.stdout.write(`Downloaded ${progress} bytes`);
                    }
                })
                .pipe(dest);
        });
    }
    catch (error) {
        console.log(error);
    }
}

function uploadFile(auth) {
    console.log('Within Upload Function...')
    const drive = google.drive({ version: 'v3', auth });
    const fileMetadata = {
        'name': 'my.jpg',//any name you want to give
        parents: ['1P3dkx3TNeQ3D-52l7DQA75DYYWZSYOYd']//folder name of google drive where you want to upload img(Optional..)
    };
    const media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream('file/a7.jpg')
    };
    drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, (err, file) => {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            console.log('File===>',file,'DAatattata==>',file.data)
            console.log('Id Feild===>',file.data.id);
            console.log('File Id: ', file.id);
        }
    });
}

