import { Client } from "basic-ftp";

async function listFtp() {
    const client = new Client();
    client.ftp.verbose = true;  

    try {
        await client.access({
            host: "acudcs001.tcsinstruments.com.au",
            port: 21,
            user: "UoWTeamUsr",
            password: "U0WT3@mAcc355!",
            secure: true,               // use AUTH TLS (explicit FTPS)
            secureOptions: {
                rejectUnauthorized: false  // ← allow self‑signed & expired certs
            }
        });

        const rootList = await client.list();
        // check or the folder and file in rootList
        console.table(
            rootList.map(item => ({
                name:       item.name,
                type:       item.type === 2 ? "Directory" : "File",
                size:       item.size,
                modifiedAt: item.modifiedAt.toISOString()
            }))
        );

        const folders = rootList.map(item => item.name);

        console.log("CHECK !!!!!!!!!!!")
        console.log(rootList)
        console.log(folders)

        for (const folder of folders) {
            console.log(`\nContents of folder '${folder}':`);
            // enter folder
            await client.cd(folder);

            // list files in this folder
            const contents = await client.list();
            console.log(contents);
            // filter for .csv files
            const csvFiles = contents
                .filter(item => item.type === "-" && item.name.toLowerCase().endsWith(".csv"))
                .map(item => ({
                    name:       item.name,
                    size:       item.size,
                    modifiedAt: item.modifiedAt.toISOString()
                }));

            if (csvFiles.length === 0) {
                console.log("  (no CSV files found)");
            } else {
                // print a simple table
                console.table(csvFiles);
            }

            // go back up
            await client.cdup();
        }
    }
    catch (err) {
        console.error("FTP error:", err);
    }
    finally {
        client.close();
    }
}

listFtp();


