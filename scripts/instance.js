/**************************************************************************************************
 * hoobs-core                                                                                     *
 * Copyright (C) 2020 HOOBS                                                                       *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

const File = require("fs-extra");
const Prompt = require("prompts");
const Sanitize = require("sanitize-filename");

const { dirname, join } = require("path");
const { execSync } = require("child_process");

module.exports = (mode, name, command) => {
    const root = dirname(File.realpathSync(__filename));

    switch ((mode || "").toLowerCase()) {
        case "install":
            const questions = [
                {
                    type: "text",
                    name: "name",
                    message: "Enter a name for the cluster instance",
                    validate: (value) => {
                        if (!value || value === "") {
                            return "a name is required";
                        }

                        return true;
                    }
                },
                {
                    type: "text",
                    name: "port",
                    initial: "52827",
                    message: "Enter the port this cluster instance will run on",
                    format: value => parseInt(value, 10),
                    validate: (value) => {
                        value = parseInt(value || "52827", 10);

                        if (Number.isNaN(value)) {
                            return "invalid port number";
                        }

                        if (value < 1 || value > 65535) {
                            return "select a port between 1 and 65535";
                        }

                        return true;
                    }
                },
                {
                    type: "text",
                    name: "username",
                    message: "Enter your HOOBS username",
                    validate: (value) => {
                        if (!value || value === "") {
                            return "a username is required";
                        }

                        return true;
                    }
                },
                {
                    type: "password",
                    name: "password",
                    message: "Enter your HOOBS password",
                    validate: (value) => {
                        if (!value || value === "") {
                            return "a password is required";
                        }
        
                        return true;
                    }
                },
                {
                    type: "text",
                    name: "bridge",
                    initial: "52826",
                    message: "Enter the bridge port for the bridge",
                    format: value => parseInt(value, 10),
                    validate: (value) => {
                        value = parseInt(value || "52826", 10);

                        if (Number.isNaN(value)) {
                            return "invalid port number";
                        }

                        if (value < 1 || value > 65535) {
                            return "select a port between 1 and 65535";
                        }

                        return true;
                    }
                },
                {
                    type: "text",
                    name: "client",
                    message: "Enter the URL of the cluster client",
                    validate: (value) => {
                        if (!value || value === "") {
                            return "a client url is required";
                        }

                        if (!/^(http(s)?:\/\/)[-a-zA-Z0-9@:%_\+.~]*$/.test(value)) {
                            return "invalid url";
                        }

                        return true;
                    }
                }
            ];
        
            Prompt(questions).then(async (result) => {
                result.service = `hoobs.${result.name.replace(/[^a-zA-Z0-9]/gi, "").toLowerCase()}.service`;
    
                writeJson(result.name.replace(/[^a-zA-Z0-9]/gi, "").toLowerCase(), "config.json", result);
    
                await (require(join(root, "./prerequisites")))();
                await (require(join(root, "./systemd")))(true, "instance", result.name, result.service, parseInt(result.port, 10), parseInt(result.bridge, 10));
                await (require(join(root, "./reboot")))(false, result.service);
            });

            break;

        case "control":
            (async () => {
                if ((name || "") !== "") {
                    const sanitized = Sanitize(name);
                    const service = `hoobs.${sanitized.replace(/[^a-zA-Z0-9]/gi, "").toLowerCase()}.service`;

                    switch ((command || "").toLowerCase()) {
                        case "log":
                            if (File.existsSync(join("/etc/systemd/system/multi-user.target.wants", service))) {
                                execSync(`journalctl -o cat -n 500 -f -u ${service}`, {
                                    stdio: "inherit"
                                });
                            } else {
                                console.log("");
                                console.log(`You must first enable the ${sanitized} service`);
                                console.log("");
                            }

                            break;

                        case "start":
                            if (File.existsSync(join("/etc/systemd/system/multi-user.target.wants", service))) {
                                execSync(`systemctl start ${service}`);
                            } else {
                                console.log("");
                                console.log(`You must first enable the ${sanitized} service`);
                                console.log("");
                            }

                            break;

                        case "stop":
                            if (File.existsSync(join("/etc/systemd/system/multi-user.target.wants", service))) {
                                execSync(`systemctl stop ${service}`);
                            } else {
                                console.log("");
                                console.log(`You must first enable the ${sanitized} service`);
                                console.log("");
                            }

                            break;

                        case "restart":
                            if (File.existsSync(join("/etc/systemd/system/multi-user.target.wants", service))) {
                                execSync(`systemctl restart ${service}`);
                            } else {
                                console.log("");
                                console.log(`You must first enable the ${sanitized} service`);
                                console.log("");
                            }

                            break;

                        case "enable":
                            if (File.existsSync(join("/etc/systemd/system/", service))) {
                                execSync(`systemctl enable ${service}`);
                            } else {
                                console.log("");
                                console.log(`You must first create the ${sanitized} service`);
                                console.log("");
                            }

                            break;    

                        case "disable":
                            if (File.existsSync(join("/etc/systemd/system/", service))) {
                                execSync(`systemctl disable ${service}`);
                            } else {
                                console.log("");
                                console.log(`You must first create the ${sanitized} service`);
                                console.log("");
                            }

                            break;    
                    }
                }
            })();
            break;

        default:
            (async () => {
                const standalone = await searchFile("/etc/systemd/system/hoobs.service", `ExecStart=${join(findNode(), "hoobs")}`);
                const client = await searchFile("/etc/systemd/system/hoobs.service", `ExecStart=${join(findNode(), "hoobs")} client`);

                let anything = false;

                if (standalone.installed) {
                    anything = true;

                    console.log("");
                    console.log("Standalone");
                    console.log("---------------------------------------------------------");
                    console.log(`hoobs.service - ${standalone.enabled ? "enabled" : "disabled"}`);
                    console.log("---------------------------------------------------------");
                }

                if (client.installed) {
                    anything = true;

                    console.log("");
                    console.log("Client");
                    console.log("---------------------------------------------------------");
                    console.log(`hoobs.service - ${client.enabled ? "enabled" : "disabled"}`);
                    console.log("---------------------------------------------------------");
                }

                if (File.existsSync("/home/hoobs/.hoobs/etc")) {
                    const entries = File.readdirSync("/home/hoobs/.hoobs/etc").filter(f => File.lstatSync(join("/home/hoobs/.hoobs/etc", f)).isDirectory());

                    let count = 0;

                    for (let i = 0; i < entries.length; i++) {
                        const instance = `hoobs.${entries[i].replace(/[^a-zA-Z0-9]/gi, "").toLowerCase()}.service`;

                        if (File.existsSync(`/etc/systemd/system/${instance}`)) {
                            if (count === 0) {
                                console.log("");
                                console.log("Instances");
                                console.log("---------------------------------------------------------");
                            }

                            if (File.existsSync(`/etc/systemd/system/multi-user.target.wants/${instance}`)) {
                                console.log(`${instance} - enabled`);
                            } else {
                                console.log(`${instance} - disabled`);
                            }

                            count += 1;
                        }
                    }

                    if (count > 0) {
                        anything = true;

                        console.log("---------------------------------------------------------");
                    }
                }

                if (!anything) {
                    console.log("");
                    console.log("There are no HOOBS instances installed.");
                }

                console.log("");
            })();

            break;
    }
};

const findNode = function() {
    const paths = (process.env.PATH || "").split(":");

    for (let i = 0; i < paths.length; i++) {
        if (File.existsSync(join(paths[i], "hoobs"))) {
            return paths[i];
        }
    }

    return "/usr/local/bin";
};

const searchFile = function (filename, search) {
    return new Promise((resolve) => {
        const results = {
            installed: false,
            enabled: false
        };

        if (File.existsSync(filename)) {
            const stream = File.createReadStream(filename);

            let remaining = "";

            stream.on("data", (data) => {
                remaining += data;

                let index = remaining.indexOf("\n");

                while (index > -1) {
                    let value = (remaining.substring(0, index) || "").trim();

                    if (value.toLowerCase() === search.toLowerCase()) {
                        results.installed = true;
                        results.enabled = File.existsSync("/etc/systemd/system/multi-user.target.wants/hoobs.service");
                    }

                    remaining = remaining.substring(index + 1);
                    index = remaining.indexOf('\n');
                }
            });

            stream.on("end", () => {
                if (remaining.length > 0) {
                    if (remaining.toLowerCase() === search.toLowerCase()) {
                        results.installed = true;
                        results.enabled = File.existsSync("/etc/systemd/system/multi-user.target.wants/hoobs.service");
                    }
                }
        
                resolve(results);
            });
        } else {    
            resolve(results);
        }
    });
};

const writeJson = function (name, filename, data) {
    if (!File.existsSync("/var/hoobs")) {
        File.mkdirSync("/var/hoobs");
        File.chmodSync("/var/hoobs", 0755);
    }

    if (!File.existsSync("/var/hoobs/.instance")) {
        File.mkdirSync("/var/hoobs/.instance");
        File.chmodSync("/var/hoobs/.instance", 0755);
    }

    if (!File.existsSync(`/var/hoobs/.instance/${name}`)) {
        File.mkdirSync(`/var/hoobs/.instance/${name}`);
        File.chmodSync(`/var/hoobs/.instance/${name}`, 0755);
    }

    if (File.existsSync(join(`/var/hoobs/.instance/${name}/`, filename))) {
        File.unlinkSync(join(`/var/hoobs/.instance/${name}/`, filename));
    }

    File.appendFileSync(join(`/var/hoobs/.instance/${name}/`, filename), JSON.stringify(data, null, 4));
    File.chmodSync(join(`/var/hoobs/.instance/${name}/`, filename), 0755);
};
