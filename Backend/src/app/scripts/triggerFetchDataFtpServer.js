// #!/usr/bin/env node
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import { fetchDataFtpServer } from './fetchDataFtpServer.js';

// dotenv.config();

// function parseArgs(argv) {
//     const args = { _: [] };
//     for (let i = 2; i < argv.length; i++) {
//         const arg = argv[i];
//         if (arg.startsWith('--')) {
//             const [key, maybeValue] = arg.split('=');
//             const name = key.replace(/^--/, '');
//             if (maybeValue !== undefined) {
//                 args[name] = maybeValue;
//             } else {
//                 const next = argv[i + 1];
//                 if (next && !next.startsWith('--')) {
//                     args[name] = next;
//                     i++;
//                 } else {
//                     args[name] = true;
//                 }
//             }
//         } else {
//             args._.push(arg);
//         }
//     }
//     return args;
// }

// (async () => {
//     try {
//         const args = parseArgs(process.argv);
//         const areaId = args.areaId || args.a;
//         const folder = args.folder || args.f;

//         if (!areaId) {
//             console.error('Error: --areaId is required');
//             process.exitCode = 1;
//             return;
//         }

//         console.log(`Starting FTP fetch for areaId=${areaId}${folder ? `, folder=${folder}` : ''}`);
//         await fetchDataFtpServer(areaId, folder ? { folder } : {});
//         console.log('Fetch completed.');
//     } catch (err) {
//         console.error('Trigger script failed:', err);
//         process.exitCode = 1;
//     } finally {
//         // Close mongoose connection if left open by fetcher
//         try {
//             if (mongoose.connection.readyState !== 0) {
//                 await mongoose.connection.close();
//             }
//         } catch (_) {}
//     }
// })();
