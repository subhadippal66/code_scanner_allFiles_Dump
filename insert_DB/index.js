const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql');

// <script src=(.*?)<\/script>

// get all script 
// <script(.*?)src=(.*?)<\/script>

// config

// const txt_file_relative_path_READ = "./read_file/test_004.txt";
const txt_file_relative_path_READ = "./read_file/17-02-2022_2.txt";

// mysql config
const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'root',
    password        : '',
    database        : 'my_table'
})

async function processLineByLine() {
    const fileStream = fs.createReadStream(txt_file_relative_path_READ);
  
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
   
  
    let line_no = 1;
    for await (const line of rl) {
    //   console.log(`Line ${line_no}: ${line}`);

      decodeLine(line);
      line_no++;
    }
}


  
processLineByLine();

var updated_path = ""; 

function decodeLine(line_str){

    // path check
    // if(line_str[0] == '/'){
    if(line_str.substring(0, 5) == 'https'){

        if(line_str[line_str.length - 1] == ':'){
            line_str = line_str.substring(0, line_str.length - 1);
        }

        updated_path = line_str;
        return;
    }

    //line no check

    let first_appreance = line_str.indexOf("<script");
    

    if(first_appreance != -1){
        

        let regex = /\d+/g;
        let string = line_str.substring(0,first_appreance);
        let matches = string.match(regex);  

        if(matches){
            let line_no = matches[0];
            
            let end_script = line_str.indexOf("</script>");

            if(end_script != -1){

                let script_tag = line_str.substring(first_appreance, end_script+9);

                // console.log(line_no);
                // console.log(script_tag);
                // console.log(updated_path);

                var path_to_append = updated_path;
                let total_occurence = 0;
                let final_occurence = -1;
                for(let i=0; i<path_to_append.length; i++){
                    if(path_to_append[i] == '/'){
                        total_occurence++;
                        final_occurence = i;
                    }
                }
                path_to_append = path_to_append.substring(0, final_occurence);   //global path of the dir

                var updated_script = "";

                // check the https://

                let findHttps = script_tag.indexOf("https://");

                if(findHttps == -1){
                    findHttps = script_tag.indexOf("http://");
                }
                if(findHttps == -1){
                    findHttps = script_tag.indexOf("//");
                    if(findHttps != -1){
                        updated_script = script_tag;
                    }
                }

                if(findHttps != -1){
                    updated_script = script_tag;
                }

                // if(1==2){
                if(findHttps == -1 && script_tag.indexOf("echo") == -1){
                    // console.log(script_tag);

                    let findDoubleDot = script_tag.indexOf("../");


                    if(findDoubleDot != -1){   //found ../ in script
                        

                        let noof_doubleDot = 0;
                        updated_script = script_tag;
                        let updated_index = -1;
                        while(updated_script.indexOf("../") != -1){

                            updated_index = updated_script.indexOf("../");
                            updated_script = updated_script.replace("../", "");
                            noof_doubleDot++;
                        }

                        //make path according to ../
                        let con_to_arr = path_to_append.split('/');
                        path_to_append = '';
                        for(let i=0; i<con_to_arr.length-noof_doubleDot-1; i++){
                            path_to_append = path_to_append.concat(con_to_arr[i]);
                            path_to_append += '/';
                        }
                        
                        // update the script

                        updated_script = [updated_script.slice(0, updated_index), path_to_append, updated_script.slice(updated_index)].join('');

                        // console.log("------------");
                        // console.log(script_tag);
                        // console.log(updated_script);
                        // console.log(noof_doubleDot);
                        // console.log(updated_index);
                        // console.log(updated_path);
                        // console.log(path_to_append);

                        // console.log("------------");

                    }

                    else{
                        // console.log(script_tag);
                        let findsrc = script_tag.indexOf(`src="`);
                        if(findsrc != -1){
                            path_to_append += '/';
                            findsrc = findsrc + 5; 
                            updated_script = [script_tag.slice(0, findsrc), path_to_append, script_tag.slice(findsrc)].join('');
                        }
                    }

                }

                // else if(script_tag.indexOf("//cdn" != -1)){
                //     updated_script = updated_script.replace("//cdn", "https://cdn");
                // }

                else if(findHttps == -1 && script_tag.indexOf("echo") != -1){

                    updated_script = script_tag;
                    while(updated_script.indexOf("<?") != -1 || updated_script.indexOf("<?php") != -1){
                        let s_index = updated_script.indexOf("<?");
                        if(s_index == -1){
                            s_index = updated_script.indexOf("<?php");
                        }
                        let e_index = updated_script.indexOf("?>");
                        let to_replace = '';
                        if(updated_script.substring(s_index, e_index).indexOf("$base") != -1){
                            to_replace = "https://justcall.io/";
                        }else{
                            to_replace ="0";
                        }

                        updated_script = updated_script.substring(0,s_index) + to_replace + updated_script.substring(e_index+2, updated_script.length);
                    }

                    // console.log('----------');
                    // console.log(script_tag);
                    // console.log(updated_script);

                }

                // insert into DB
                script_tag = script_tag.replace('$', '*');
                insertIntoTable(line_no, script_tag, updated_path, updated_script, path_to_append);

            }
        }
    }
}


// mysql


function insertIntoTable(line_no, script_tag, updated_path, updated_script, path_to_append){
    pool.getConnection((err, connection) => {
        if(err) throw err

        let insert_query = "INSERT INTO `script_location` (`line_no`, `script`, `path`, `updated_script`, `file_path`, `version`, `vulnerable`, `zap_col_1`) VALUES ('"+line_no+"', '"+script_tag+"', '"+updated_path+"', '"+updated_script+"', '"+path_to_append+"' , '1', '2', '');";

        // console.log(insert_query);

        connection.query(insert_query, (err, rows) => {
            connection.release() // return the connection to pool
            if (!err) {                
                // console.log(rows);
                // console.log('.');
            } else {
                console.log(err);
            }            
        })
    })
}