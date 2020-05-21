const inspect = require('util').inspect;
const fs = require('fs');
const {Base64Decode} = require('base64-stream');
const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;

const config = require('../config/email-rec-config');

var imap = new Imap(config);

function toUpper(thing) { return thing && thing.toUpperCase ? thing.toUpperCase() : thing;}

function findAttachmentParts(struct, attachments) {
  attachments = attachments ||  [];
  for (var i = 0, len = struct.length, r; i < len; ++i) {
    if (Array.isArray(struct[i])) {
      findAttachmentParts(struct[i], attachments);
    } else {
      if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) > -1) {
        attachments.push(struct[i]);
      }
    }
  }
  return attachments;
}

function buildAttMessageFunction(attachment) {
  var filename = attachment.params.name;
  var encoding = attachment.encoding;

  return function (msg, seqno) {
    var prefix = '(#' + seqno + ') ';
    msg.on('body', function(stream, info) {
      //Create a write stream so that we can stream the attachment to file;
      console.log(prefix + 'Streaming this attachment to file', filename, info);
      var writeStream = fs.createWriteStream('file_system/' + filename);
      writeStream.on('finish', function() {
        console.log(prefix + 'Done writing to file %s', filename);
      });

      //stream.pipe(writeStream); this would write base64 data to the file.
      //so we decode during streaming using 
      if (toUpper(encoding) === 'BASE64') {
        //the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
        stream.pipe(new Base64Decode()).pipe(writeStream);
      } else  {
        //here we have none or some other decoding streamed directly to the file which renders it useless probably
        stream.pipe(writeStream);
      }
    });
    msg.once('end', function() {
      console.log(prefix + 'Finished attachment %s', filename);
    });
  };
}

//This handles emails once the box is opened
var handleBox = function(err, box) {
  if (err) throw err;
  imap.search(['UNSEEN'], function(err, results) {
    if (err) {throw err}
      try {
        var f = imap.fetch(results, {
          bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', ''],
          markSeen: false,
          struct: true
        });
      } catch(err) {          
        console.log(err.message);
        return;
      }

      f.on('message', function (msg, seqno) {
        console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';

        msg.on('body', function(stream, info) {


          var options = {
            skipHtmlToText: true
          };

          simpleParser(stream, options)
          .then(parsed => {
            console.log(prefix + 'Subject: ' + parsed.subject);
            console.log(prefix + 'From: ' + parsed.from.text);
            console.log(prefix + 'To: ' + parsed.to.text);
            console.log(prefix + 'CC: ' + parsed.cc);
            console.log(prefix + 'Date: ' + parsed.date);
            console.log(prefix + 'inReplyTo: ' + parsed.inReplyTo);
            console.log(prefix + 'Html: ' + parsed.html);
            console.log(prefix + 'Text: ' + parsed.text);
            console.log(prefix + 'textAsHtml: ' + parsed.textAsHtml);
            console.log(prefix + 'Attachments: ' + parsed.attachments);
          })
          .catch(err => console.log(err));


          // simpleParser(stream).then(function(mail_object) {
          //       console.log("From:", mail_object.from.value);
          //       console.log("Subject:", mail_object.subject);
          //       // console.log("Text body:", mail_object.text);
          //     }).catch(function(err) {
          //       console.log('An error occurred:', err.message);
          //     });

          // var buffer = '', count = 0;
          // stream.on('data', function(chunk) {
          //   count += chunk.length;            
          //   buffer += chunk.toString('utf8');
          //   if (info.which == 'TEXT') {
          //     console.log(prefix + 'Body [%s] (%d/%d)', inspect(info.which), count, info.size);
          //   }
          // });
          // stream.once('end', function() {
          //   // console.log(buffer);
          //   if (info.which !== 'TEXT')
          //     console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
          //   else {
          //     console.log(prefix + 'Body [%s] Finished', inspect(info.which));             
          //   }
          // });
        });
        msg.once('attributes', function(attrs) {
          var attachments = findAttachmentParts(attrs.struct);
          console.log(prefix + 'Has attachments: %d', attachments.length);
          for (var i = 0, len=attachments.length ; i < len; ++i) {
            var attachment = attachments[i];
          /*This is how each attachment looks like {
              partID: '2',
              type: 'application',
              subtype: 'octet-stream',
              params: { name: 'file-name.ext' },
              id: null,
              description: null,
              encoding: 'BASE64',
              size: 44952,
              md5: null,
              disposition: { type: 'ATTACHMENT', params: { filename: 'file-name.ext' } },
              language: null
            }
            */
            console.log(prefix + 'Fetching attachment %s', attachment.params.name);
          var f = imap.fetch(attrs.uid , { //do not use imap.seq.fetch here
            bodies: [attachment.partID],
            struct: true
          });
          //build function to process attachment message
          f.on('message', buildAttMessageFunction(attachment));
        }
      });
        msg.once('end', function() {     
          console.log(prefix + 'Finished email');
        });
      });
      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });
      f.once('end', function() {
        console.log('Done fetching all messages!');
        // Do not end connection
        imap.end();
      });
    });    
};

imap.once('ready', function() {
  console.log('Opening Inbox');
  // 1: Folder Name, 2: false = Read or Write
  // setInterval(function() {
    imap.openBox('INBOX', false, handleBox)
  // } ,3000);  
});

imap.once('error', function(err) {
  console.log(err);
});

imap.once('end', function() {
  console.log('Connection ended');
});

imap.connect();
