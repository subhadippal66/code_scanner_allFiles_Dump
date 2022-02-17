const https = require('https');

const fs = require('fs');
const readline = require('readline');


// const txt_file_relative_path_READ = "./a.txt";
const txt_file_relative_path_READ = "./inpdata1.txt";

const html_file_relative_path_WRITE = "./output1_2.txt";
var logger = fs.createWriteStream(html_file_relative_path_WRITE, {
    flags: 'a' // 'a' means appending (old data will be preserved)
})

processLineByLine();

async function processLineByLine() {
    const fileStream = fs.createReadStream(txt_file_relative_path_READ);
  
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
   
  
    let line_no = 1;
    for await (const line of rl) {
    //   console.log(`Line ${line_no}: ${line}`);

        if(line.substring(0,2)=='//'){
    // console.log('aaa');

            try{
                await ajax('https:'+line)
            }catch(e){

            }
        }else{
            try{
                await ajax(line)
            }catch(e){

            }
        }

      line_no++;
    }
}


// ajax('https://cdn.justcall.io/main/assets/js/retina.js')
async function ajax(path){

    let jslib = path.split('/');
    let jsname = jslib[jslib.length-1].split('.')[0];

    // console.log(jslib[jslib.length-1].split('.')[0])

    https.get(path, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
// \d[.]\d[^\s]

// \d+([\,]\d+)?\S+
        const regex1 = new RegExp("\\d+([\\,]\\d+)?\\S+");
        const regex2 = new RegExp("(?:(\\d+)\\.)?(?:(\\d+)\\.)?(?:(\\d+)\\.\\d+)");

        const a = regex1.exec(data.substring(0,500));
        const b = regex2.exec(data.substring(0,500));
        // 1.2
        let version = ''
        let isIt = true;
        if(a!=null && b!=null){
            // const b = a[0].split('.');
            // b.forEach(element => {
            //     // console.log(element);
            //     // console.log(parseInt(element))
            //     if(element != parseInt(element))  {
            //         isIt = false;
            //     }
            // });
            // console.log(a);
            if(a[0].includes('beta')){
                console.log(a[0]);
                version = isIt?a[0]:'';
            }else{
                version = isIt?b[0]:'';
            }

            
        }

        logger.write("\n"+jsname+'--**--'+version+'--**--'+path);

        // console.log(jsname+'  -  '+version)
        
    });

    // 12.34

    }).on("error", (err) => {
    console.log("Error: " + err.message);
    });

}