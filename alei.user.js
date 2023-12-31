// ==UserScript==
// @name         ALE Improvements
// @version      8.2
// @description  Changes to make ALE better.
// @author       mici1234, wanted2001, gcp5o
// @match        *://www.plazmaburst2.com/level_editor/map_edit.php*
// @run-at       document-start
// @icon         https://github.com/ZenoABC/ALEI/blob/main/icon.png?raw=true
// @grant        none
// ==/UserScript==

// Shorthand things
function $id(id) {
    return document.getElementById(id);
}
function $query(selector) {
    return document.querySelector(selector);
}

const ROOT_ELEMENT = document.documentElement;
const stylesheets = document.styleSheets;

const INFO = 0;
const DEBUG = 1;
const DEBUG2 = 2;
const WARN = -1;

// Just for styling.
const ANSI_RESET = "\x1B[0m"
const ANSI_RED = "\x1B[31m"
const ANSI_GREY = "\x1B[37m"
const ANSI_YELLOW = "\x1B[93m"
const ANSI_GREEN = "\x1B[92m"
const ANSI_CYAN = "\x1B[96m"

function readStorage(key, defaultValue, func) {
    let val = localStorage[key];
    if (val === undefined) return defaultValue;
    return func(localStorage[key])
}

if (localStorage['RIGHT_PANEL_WIDTH'] != undefined) {
    localStorage["ALEI_RightPanelWidth"] = localStorage["RIGHT_PANEL_WIDTH"];
    localStorage.removeItem("RIGHT_PANEL_WIDTH");
}

let aleiSettings = {
    rightPanelSize:     readStorage("ALEI_RightPanelWidth",   "30vw",  (val) => val            ),
    triggerEditTextSize:readStorage("ALEI_EditTextSize",      "12px",  (val) => val + "px"     ),
    starsImage:         readStorage("ALEI_StarImage",    "stars2.jpg", (val) => val            ),
    logLevel:           readStorage("ALEI_LogLevel",             0,     parseInt               ),
    showTriggerIDs:     readStorage("ALEI_ShowTriggerIDs",       false, (val) => val === "true"),
    enableTooltips:     readStorage("ALEI_ShowTooltips",         false, (val) => val === "true"),
    showSameParameters: readStorage("ALEI_ShowSameParameters",   true , (val) => val === "true"),
    rematchUID:         readStorage("ALEI_RemapUID",             false, (val) => val === "true"),
    showIDs:            readStorage("ALEI_ShowIDs",              false, (val) => val === "true")
}
window.aleiSettings = aleiSettings;

function writeStorage(key, value) {
    try {
        localStorage[key] = value;
    } catch (e) {
        NewNote("ALEI: There was some issue trying to save into storage. You might need to clear your datas.", note_bad);
        console.error(e);
    }
}

let levelToNameMap = {
    0: `${ANSI_CYAN}INFO${ANSI_RESET}`,
    1: `${ANSI_GREEN}DEBUG${ANSI_RESET}`,
    2: `${ANSI_GREEN}DEBUG2${ANSI_RESET}`
}

function aleiLog(level, text) {
    if (level === WARN) {
        console.warn(`[ALEI:WARNING]: ${text}`);
        NewNote(`ALEI: Please check console.`, "#FFFF00");
    }else if (level <= aleiSettings.logLevel)
        console.log(`[${ANSI_GREEN}ALEI:${levelToNameMap[level]}]: ${text}`)
}
aleiLog(INFO, "Starting up...");

// Original functions, globally saved here if needed
// JS_ prefix for JavaScript ones, ALE_ for ALE ones
let JS_setTimeout = window.setTimeout;
let JS_eval = window.eval;

let aleiSessionID = null; // ID of this session
let aleiSessionList = []; // Set of known session IDs

function updateParameters() {
    // Does things to parameters depending on purpose.
    function add(key, type, name, objType) {
        param_type[param_type.length] = [key, type, name, "", objType];
    }
    // Adding parameters that the game accepts but ALE does not have.
    add("moving", "bool", "Is Moving?", "door");
    add("tarx", "value", "Target X", "door");
    add("tary", "value", "Target Y", "door");
    // Adding our own parameter for showıng IDs.
    param_type[param_type.length] = ["__id", "value", "ID", "", "*"]
    // Patching parameters
    param_type[0] = ['uid', 'string', 'Name', 'Object Name', '*'];
}

function updateSounds() {
    // Adds sounds that exist in game but not in ALE
    let SVTS = special_values_table["sound"];
    SVTS['am_base'] = 'Indoor Ambience';
    SVTS['am_wind'] = 'Outdoor Ambience';
    SVTS['android2_die'] = 'DT-148 - Death';
    SVTS['android2_hurt'] = 'DT-148 - Hurt';
    SVTS['android2_welcome2'] = 'DT-148 - Alerted';
    SVTS['arrin_death1'] = 'Arrin - Death';
    SVTS['arrin_dying'] = 'Arrin - Dying';
    SVTS['arrin_hurt1'] = 'Arrin - Hurt 1';
    SVTS['arrin_hurt2'] = 'Arrin - Hurt 2';
    SVTS['arrin_welcome1'] = 'Arrin - Alerted 1';
    SVTS['arrin_welcome2'] = 'Arrin - Alerted 2';
    SVTS['arrin_welcome3'] = 'Arrin - Alerted 3';
    SVTS['bounce_bullet'] = 'Falkonian PSI Cutter - Shot Bounce';
    SVTS['dart4'] = 'Medic Pistol';
    SVTS['exp_event_stop'] = 'EXP - Stop';
    SVTS['exp_level'] = 'EXP - Level Up';
    SVTS['exp_tick'] = 'EXP - Gain';
    SVTS['gameplay_song'] = 'Katharsys - Erges';
    SVTS['gravitator2'] = 'Floor gravitator noice';
    SVTS['helm_proxy_alert_over_hereB'] = 'Proxy - Over here!';
    SVTS['helm_proxy_alert_take_coverB'] = 'Proxy - Take cover!';
    SVTS['helm_proxy_alert_up_thereA'] = 'Proxy - Up there!';
    SVTS['helm_proxy_death3'] = 'Proxy - Death 1';
    SVTS['helm_proxy_death4'] = 'Proxy - Death 2';
    SVTS['helm_proxy_death5'] = 'Proxy - Death 3';
    SVTS['helm_proxy_death6'] = 'Proxy - Death 4';
    SVTS['helm_proxy_dyingC'] = 'Proxy - Help! 1';
    SVTS['helm_proxy_dyingF'] = 'Proxy - Help! 2';
    SVTS['helm_proxy_enemy_down_fantasticA'] = 'Proxy - Fantastic.';
    SVTS['helm_proxy_enemy_down_got_oneD'] = 'Proxy - Got one.';
    SVTS['helm_proxy_enemy_down_niceA'] = 'Proxy - Nice. 1';
    SVTS['helm_proxy_enemy_down_niceC'] = 'Proxy - Nice. 2';
    SVTS['helm_proxy_hurt11'] = 'Proxy - Hurt 1';
    SVTS['helm_proxy_hurt12'] = 'Proxy - Hurt 2';
    SVTS['helm_proxy_hurt13'] = 'Proxy - Hurt 3';
    SVTS['helm_proxy_hurt14'] = 'Proxy - Hurt 4';
    SVTS['helm_proxy_hurt15'] = 'Proxy - Hurt 5';
    SVTS['helm_proxy_hurt17'] = 'Proxy - Hurt 6';
    SVTS['helm_proxy_hurt4'] = 'Proxy - Hurt 7';
    SVTS['helm_proxy_hurt5'] = 'Proxy - Hurt 8';
    SVTS['helm_proxy_hurt8'] = 'Proxy - Hurt 9';
    SVTS['helm_proxy_hurt9'] = 'Proxy - Hurt 10';
    SVTS['hexagon_death1'] = 'Hexagon - Death 1';
    SVTS['hexagon_death2'] = 'Hexagon - Death 2';
    SVTS['hexagon_pain1'] = 'Hexagon - Hurt 1';
    SVTS['hexagon_pain2'] = 'Hexagon - Hurt 2';
    SVTS['hexagon_pain3'] = 'Hexagon - Hurt 3';
    SVTS['hexagon_pain4'] = 'Hexagon - Hurt 4';
    SVTS['hexagon_welcome1'] = 'Hexagon - Alerted 1';
    SVTS['hexagon_welcome2'] = 'Hexagon - Alerted 2';
    SVTS['hexagon_welcome3'] = 'Hexagon - Alerted 3';
    SVTS['main_song'] = 'NPhonix - Antigravity';
    SVTS['orakin_death1'] = 'Orakin - Death 1';
    SVTS['orakin_death2'] = 'Orakin - Death 2';
    SVTS['orakin_hurt'] = 'Orakin - Hurt';
    SVTS['orakin_welcome'] = 'Orakin - Alerted';
    SVTS['proxy_alert_over_hereB'] = 'No Helm Proxy - Over here!';
    SVTS['proxy_alert_take_coverB'] = 'No Helm Proxy - Take cover!';
    SVTS['proxy_alert_up_thereA'] = 'No Helm Proxy - Up there!';
    SVTS['proxy_death3'] = 'No Helm Proxy - Death 1';
    SVTS['proxy_death4'] = 'No Helm Proxy - Death 2';
    SVTS['proxy_death5'] = 'No Helm Proxy - Death 3';
    SVTS['proxy_death6'] = 'No Helm Proxy - Death 4';
    SVTS['proxy_dyingC'] = 'No Helm Proxy - Help! 1';
    SVTS['proxy_dyingF'] = 'No Helm Proxy - Help! 2 ';
    SVTS['proxy_enemy_down_fantasticA'] = 'No Helm Proxy - Fantastic.';
    SVTS['proxy_enemy_down_got_oneD'] = 'No Helm Proxy - Got one.';
    SVTS['proxy_enemy_down_niceA'] = 'No Helm Proxy - Nice. 1';
    SVTS['proxy_enemy_down_niceC'] = 'No Helm Proxy - Nice. 2';
    SVTS['proxy_hurt11'] = 'No Helm Proxy - Hurt 1';
    SVTS['proxy_hurt12'] = 'No Helm Proxy - Hurt 2';
    SVTS['proxy_hurt13'] = 'No Helm Proxy - Hurt 3';
    SVTS['proxy_hurt14'] = 'No Helm Proxy - Hurt 4';
    SVTS['proxy_hurt15'] = 'No Helm Proxy - Hurt 5';
    SVTS['proxy_hurt17'] = 'No Helm Proxy - Hurt 6';
    SVTS['proxy_hurt4'] = 'No Helm Proxy - Hurt 7';
    SVTS['proxy_hurt5'] = 'No Helm Proxy - Hurt 8';
    SVTS['proxy_hurt8'] = 'No Helm Proxy - Hurt 9';
    SVTS['proxy_hurt9'] = 'No Helm Proxy - Hurt 10';
    SVTS['silk_alert_contactA'] = 'Silk - Contact!';
    SVTS['silk_alert_i_see_oneA'] = 'Silk - I see one.';
    SVTS['silk_alert_there_is_oneA'] = 'Silk - There is one...!';
    SVTS['silk_death1B'] = 'Silk - Death 1';
    SVTS['silk_death2B'] = 'Silk - Death 2';
    SVTS['silk_dyingB'] = 'Silk - Not good...';
    SVTS['silk_enemy_down_brilliantC'] = 'Silk - Brilliant.';
    SVTS['silk_enemy_down_eliminatedB'] = 'Silk - Eliminated.';
    SVTS['silk_enemy_down_hell_yeahB'] = 'Silk - Hell yeah!';
    SVTS['silk_enemy_down_ive_got_oneB'] = 'Silk - I got one!';
    SVTS['silk_enemy_down_minus_oneB'] = 'Silk - -1.';
    SVTS['silk_enemy_down_no_kicking_for_youB'] = 'Silk - No kicking for you.';
    SVTS['silk_hurt1B'] = 'Silk - Hurt 1';
    SVTS['silk_hurt2B'] = 'Silk - Hurt 2';
    SVTS['silk_hurt5'] = 'Silk - Hurt 3';
    SVTS['silk_hurt6'] = 'Silk - Hurt 4';
    SVTS['silk_hurt9B'] = 'Silk - Hurt 5';
    SVTS['wea_crossfire2'] = 'Crossfire CR-145 Vortex';
    SVTS['wea_ditzy_cs_ik'] = 'Assault Rifle CS-IK';
    SVTS['wea_glhf'] = 'Grenade Launcher CS-GLHF';
    SVTS['wea_incompetence_archetype_27xx_fire'] = 'Archetype 27XX';
    SVTS['wea_lazyrain_gravy_rl'] = 'Falkonian Anti-Grav Rocket Launcher';
    SVTS['wea_m202'] = 'Rocket Launcher CS-Barrage';
    SVTS['wea_moonhawk_railgun'] = 'Crossfire CR-34 Marauder';
    SVTS['wea_ph01'] = 'Crossfire CR-54 Viper';
    SVTS['wea_plasma_shotgun'] = 'Plasma Shotgun';
    SVTS['wea_rail_alt2'] = 'Falkonian PSI Cutter';
    SVTS['wea_thetoppestkek_shotgun_nxs25'] = 'Shotgun NXS-25';
    SVTS['xin_celebrate'] = 'Xin - Celebrating';
    SVTS['xin_death'] = 'Xin - Death';
    SVTS['xin_enemy_spotted'] = 'Xin - Alerted';
    SVTS['xin_hit'] = 'Xin - Hurt';
    let groskVoices = [
        ["death", "Death", 2],
        ["dying", "Dying", 2],
        ["edown", "Celebrating", 3],
        ["welcome", "Alerted", 5],
        ["hurt", "Hurt", 3]
    ];
    for (let i = 0; i < groskVoices.length; i++) {
        let voice = groskVoices[i];
        for (let j = 1; j <= voice[2]; j++) {
            SVTS["Grosk_" + voice[0] + j] = "Grosk - " + voice[1] + " " + j;
        }
    }
}

function updateVoicePresets() {
    // Adds voice presets that exist in game but not in ALE
    let VP = special_values_table['voice_preset'];
    VP['proxy_helmetless'] = 'Proxy (helmetless)';
    VP['silk'] = 'Silk';
    VP['orakin'] = 'Orakin';
    VP['arrin'] = 'Arrin';
    VP['civilian_male'] = 'Civilian Male';
    VP['vulture'] = 'Vulture';
    VP['crossfire_sentinel'] = 'Crossfire Sentinel';
    VP['xin'] = 'Xin';
    VP["grosk"] = "Grosk";
}

function updateStyles() {
    // Changes some stylesheets to open up to things like resizable right panel.
    for(let i1 = 0; i1 < stylesheets.length; i1++) {
        let styleSheet = stylesheets[i1];
        for (let i2 = 0; i2 < styleSheet.rules.length; i2++) {
            let rule = styleSheet.rules[i2];
            switch(rule.selectorText) {
                case ".p_i":
                    rule.style.setProperty("display", "flex");
                    break;
                case ".rightui":
                    rule.style.setProperty("width", aleiSettings.rightPanelSize);
                    break;
                case ".pa1":
                    rule.style.setProperty("flex-grow", 0);
                    rule.style.setProperty("flex-shrink", 0);
                    break;
                case ".pa2":
                    rule.style.setProperty("width", "100%");
                    break;
                case ".opcode_field":
                    rule.style.setProperty("font-size", aleiSettings.triggerEditTextSize);
                    break;
                case "#rparams":
                    rule.style.setProperty("height", "var(--ALEI_RPARAMS_HEIGHT)");
                    break;
                default:
                    break;
            }
        }
    }
    $id("stars").style.setProperty("background-image", `url(${aleiSettings.starsImage})`)
    let _th = THEME;
    ThemeSet(THEME_BLUE);
    ThemeSet(_th);
}

function updateSkins() {
    // Adds skins that exist in game but not in ALE.
    let charlists = [
        [10, "Head Gib"],
        [20, "Arm Gib"],
        [30, "Leg Gib"],
        [50, "Heavy Hero (Only Head and Arms)"],
        [60, "Proxy (Only Head and Arms)"],
        [62, "Proxy (No Limbs)"],

        [38, "GoldenKnife Noir Lime"],
        [39, "RootZ Noir Lime"],

        [151, "Purple Xin"],
        [152, "Golden Xin"],
        [153, "Blue Xin"],
        [154, "Red Xin"],
        [155, "Amber Xin"],

        [156, "Nirvana Noir Lime"],

        [157, "Purple Gallynew"],
        [158, "Golden Gallynew"],
        [159, "Blue Gallynew"],
        [160, "Red Gallynew"],
        [161, "Amber Gallynew"],

        [162, "Pinkine"],
        [163, "Raider"],
        [164, "Blue Heavy Hero"],
        [165, "Red Heavy Hero"],
        [166, "Orakin"],
        [167, "Husk"],
        [168, "Hex"],
        [169, "Arrin"],
        [170, "Heavy Usurpation Soldier"],

        [171, "Cyber Grub by S1lk"],
        [172, "Grosk"],
        [173, "Futuristic Knight"],
        [174, "Uncivil Proxy"],

        [175, "Serkova Insertion Unit"],
        [176, "Moon Marksman"],

        [177, "Slayer"],

        [178, "Newgen Marine"],
        [179, "Sgt. Davais"],
        [180, "Phantom (Orange)"],
        [181, "Huntsmen"],
        [182, "Huntsmen (Swamp)"],
        [183, "Lt. Ferbo"],
        [184, "Titan"],
        [185, "Vorean"],
        [186, "Drohnen Skinnisher"],
        [187, "Cromastakan"],
        [188, "Sgt. Davais (Purple)"],
        [189, "Maroom"],
        [190, "Outsider"],
        [191, "Serkova Recon Unit"],
        [192, "Drohnen Drifter"],
        [193, "Moon Captain"],
        [194, "Phantom (Blue)"],
        [195, "Wraith"],
        [196, "Earth Heavy Spec. Op"],
        [197, "Phantom (Purple)"],
        [198, "Deleted Character"],
        [199, "Drohnen Skirmisher"],
        [200, "Deleted Character"],
        [201, "Deleted Character"],
        [202, "Deleted Character"],
        [203, "Serkova Gunner Unit"],
        [204, "Serkova Grenader Unit"],
        [205, "Serkova Team Leader"],
        [206, "Serkova Resource Unit"],
        [207, "Serkova Technician Unit"],
        [208, "Serkova Grub"],
        [209, "Serkova Reinforced Grub"],
        [210, "Serkova Devastator Grub"],
        [211, "XBT-117 Android"],
        [212, "Teneguilae"]
    ]
    for(let li = 0; li < charlists.length; li++) {
        let charID = charlists[li][0];
        let paddedCharID = charID.toString().padStart(4, "0")
        let charName = charlists[li][1];
        let src = "https://www.plazmaburst2.com/level_editor/chars_full/char" + paddedCharID + ".png"
        special_values_table['char'][charID] = '<span style=\'background:url(' + src + '); width: 16px; height: 16px; display: inline-block; background-position: center; background-position-x: 30%; background-position-y: 26%; background-size: 67px;vertical-align: -4px;\'></span> ' + charName;
        img_chars_full[charID] = new Image();
        img_chars_full[charID].src = 'chars_full/char' + paddedCharID + '.png';
    }
}

function optimize() {
    // VSync.
    window.setTimeout = (f, ms) => {
        if (f == ani) {window.requestAnimationFrame(ani)}
        else return JS_setTimeout(f, ms);
    }
    let _browseImages = window.BrowseImages;
    let ogImageLists = {};
    // Image caching.
    window.BrowseImages = function(for_class = 'bg_model', current_value = '', callback = null) {
        // If cache doesn't have the class we are looking for, we will just set default value.
        if (ogImageLists[for_class] == undefined) {
            ogImageLists[for_class] = "[ALEI] Loading...";
            aleiLog(INFO, `Will cache response of ${for_class}`);
        }
        // Overwrite setTimeout temporarily, as BrowseImages calls setTimeout for ServerRequest which sets the innerHTML of image_list
        let ost = window.setTimeout;
        window.setTimeout = (f, ms) => {
            window.setTimeout = ost; // Assign original setTimeout
            window.ServerRequest = (req, op, callback = null) => {
                window.ServerRequest = ALEI_ServerRequest; // Assign original ServerRequest
                // We made ServerRequest an async function, so we can just register on it
                ServerRequest(req, op, callback).then(() => {
                    ogImageLists[for_class] = image_list.innerHTML;
                });
            };
            f();
        }
        _browseImages(for_class, current_value, callback);
        image_list.innerHTML = ogImageLists[for_class]; // Show what is in cache. (If cache didn't have the class, it will just show the previously set default value)
    }
}

function updateVehicles() {
    // Adding vehicles that exist in game but not in ALE. Currently only veh_hh, which is grabbable ledge.
    let _SVTV = special_values_table["vehicle_model"];
    let vehicles = [
        ["veh_hh", "Grabbable Ledge", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACLSURBVEhLYxhxgBFE2M3/r/vvH0MQWISGgImJYd2hRMbLIDbYYpu5/+t/MzEEf2diuALi0wJw/mPQYf3HsPZIMmMjiA+3+BMLg/olIYblID4tgN47hki+Pww3YRYzgUUHAIxaTDcwajHdwKjFdAOjFtMNjFpMNzBqMd3AqMV0AwPbrh6InsQAAQYGAA8CLDKAAcpOAAAAAElFTkSuQmCC"]
    ]
    for(let i = 0; i < vehicles.length; i++) {
        let vehicle = vehicles[i];
        let model = vehicle[0];
        let name = vehicle[1];
        let image = vehicle[2];
        _SVTV[model] = `<img src='${image}' border=0 height=12 style=vertical-align:middle title='${name}' > ${name}`
        img_vehicles[model] = new Image();
        img_vehicles[model].src = image;
    }
}

function updateGuns() {
    // Adds guns that exist in game but not in ALE. Currently only one isn't visible in ALE, and that is joke weapon: NARL
    let guns = [
        ["gun_rl0", "BETA Rocket Launcher", "data:image/png;base64,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"]
    ];
    for(let i = 0; i < guns.length; i++) {
        let gun = guns[i];
        let gun_model = gun[0];
        let gun_name = gun[1];
        let gun_image = gun[2];
        special_values_table["gun_model"][gun_model] = `<img src='${gun_image}' border=0 width=80 height=20 style=vertical-align:baseline title='${gun_name}'>`
        img_guns[gun_model] = new Image();
        img_guns[gun_model].src = gun_image;
    }
}

function updateDecors() {
    // Adds decors that exist in game, but not in ALE. Currently only hakase easter egg is known.
    window.img_decors = CACHED_DECORS; // For some reason img_decors gets resetted
    let decors = [
        ["hakase", "Hakase", "data:image/png;base64,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"]
    ];
    for(let i = 0; i < decors.length; i++) {
        let decor = decors[i];
        let decor_model = decor[0];
        let decor_name = decor[1];
        let decor_image = decor[2];
        special_values_table["decor_model"][decor_model] = decor_name; // Add to known decors.
        img_decors[decor_model] = new Image();
        img_decors[decor_model].src = decor_image;
        CACHED_DECORS[decor_model] = img_decors[decor_model];
        CUSTOM_IMAGES_APPROVED[decor_model] = true; // Since it's obviously vanilla, and other vanilla decors are approved, it's only natural if we approve added decors too
    }
    window.ALEI_decors = decors;
}

function updateOffsets() {
    // Because hakase decor and grabbable ledge image is made with hand manually and doesn't come from website, and that there is no
    // inbuilt offset, we have to offset those to make sure they show up in ALE correctly.
    let toosc = window.ThinkOfOffsetClass;
    window.ThinkOfOffsetClass = function(tc, esi) {
        if (tc == "vehicle" && offsets[esi.pm.model] != undefined) {
            return "alei_" + esi.pm.model;
        } else if (tc == "decor" && offsets[esi.pm.model] != undefined) {
            return "alei_" + esi.pm.model;
        } else return toosc(tc, esi);
    }
    let offsets = {
        veh_hh: {x: -15, y: -15, w: 30, h: 30},
        hakase: {x: -18, y: -57, w: 40, h: 60}
    }
    for (let key in offsets) {
        let off = offsets[key];
        lo_x["alei_" + key] = off.x;
        lo_y["alei_" + key] = off.y;
        lo_w["alei_" + key] = off.w;
        lo_h["alei_" + key] = off.h;
    }
}

function updateTriggers() {
    // This is where we will rename some triggers.
    // For now it's only 378, but we got more triggers like renaming 328
    addTrigger(378, "Gun &#8250; Add hex color 'B' to gun 'A'", "gun", "string");
}

function updateObjects() {
    // Shorthand for object-related functions as to not clutter console.
    updateGuns();
    updateVehicles();
    updateDecors();
    updateTriggers();
}

function updateButtons() {
    let topPanel = $id("top_panel");
    let childs = topPanel.children;

    // We redirect the manual page to EaglePB2's.
    childs[16].value = "Eagle's Manual";
    childs[16].setAttribute("onclick", "window.open('https://eaglepb2.gitbook.io/pb2-editor-manual/', '_blank');")

    // We dont want our new buttons to appear after "rights", so we will store "rights" beforehand and remove them, we'll add them back once we are done
    let appendBack = (topPanel.removeChild(childs[childs.length - 1])).outerHTML;
    appendBack = (topPanel.removeChild(childs[childs.length - 1])).outerHTML + appendBack;

    // Remove pad (we will add our own later).
    topPanel.removeChild(childs[childs.length - 1])

    window.aleiButtonClicks = {};

    // Convenience function for doing easy top panel buttons
    function createButton(text, internalName, onClick) {
        let button = document.createElement("input");
        button.setAttribute("class", "field_btn");
        button.setAttribute("type", "button");
        button.setAttribute("value", text);
        button.setAttribute("onclick", `aleiButtonClicks['${internalName}']()`);
        window.aleiButtonClicks[internalName] = onClick;

        let pad = document.createElement("div");
        pad.setAttribute("class", "q");

        topPanel.appendChild(button);
        topPanel.appendChild(pad);
    }
    let bigPad = document.createElement("div");
    bigPad.setAttribute("class", "q3");
    topPanel.appendChild(bigPad);

    // "Download XML" button.
    createButton("Download XML", "downloadXMLButton", exportXML);
    // "Insert XML" button.
    createButton("Insert XML", "insertXMLButton", () => {
        let file = confirm("File (OK) or text (Cancel) ?");

        if (file) {
            let fileInput = document.createElement("input");

            fileInput.type = "file";

            fileInput.onchange = function() {
                if (fileInput.files[0]) {
                    if (fileInput.files[0].name.split(".")[1] == "xml") {
                        let reader = new FileReader();

                        reader.onload = function() {
                            insertXML(reader.result);

                            fileInput.remove();
                        }

                        reader.readAsText(fileInput.files[0]);
                    } else {
                        alert("Invalid file extension.");
                    }
                }
            }

            fileInput.click();
        } else {
            let xml = prompt("Enter XML:", "");

            if (xml !== null) {
                insertXML(xml);
            }
        }
    });
    createButton("ALEI Settings", "openALEISettings", showSettings);
    // Readd 'rights' back.
    topPanel.innerHTML += appendBack;
    // Update original reference
    window.mapid_field = $id("mapid_field");
    mapid_field.value = mapid; // And update map id field value manually.
}

function addClipboardSync() {
    let clipboard_channel = new BroadcastChannel("ale_clipboard");

    ///////////////
    // Receiving //
    ///////////////
    clipboard_channel.onmessage = (msg) => {
        let data = msg.data;
        let kind = data.kind;
        if (kind == "send") {
            let recipient = data.recipient;
            let clip_name  = data.clip_name;
            let clip_data  = data.clip_data;

            if (recipient == undefined || recipient == aleiSessionID) {
                aleiLog(DEBUG, '/ale_clipboard/ got data for ' + clip_name);
                sessionStorage[clip_name] = clip_data;
            }
        }
        if (kind == "get") {
            if (aleiSessionID > Math.min(...aleiSessionList)) return;

            let session_id = data.session_id;
            aleiLog(DEBUG, '/ale_clipboard/ syncing to ' + session_id);
            for (let i = 0; i <= 10; i++) {
                let clip_name = "clipboard" + (i == 0 ? "" : ("_slot" + (i-1)));
                let clip_data = sessionStorage[clip_name];
                if (clip_data == undefined) continue;
                clipboard_channel.postMessage({kind: "send", recipient: session_id, clip_name, clip_data});
            }
        }
    }

    // Initial Sync
    aleiLog(DEBUG, '/ale_clipboard/ requesting');
    clipboard_channel.postMessage({kind: "get", session_id: aleiSessionID});

    /////////////
    // Sending //
    /////////////
    let ALE_CopyToClipBoard = window.CopyToClipBoard;
    window.CopyToClipBoard = (clip_name) => {
        ALE_CopyToClipBoard(clip_name);
        let clip_data = sessionStorage[clip_name];
        clipboard_channel.postMessage({kind: "send", clip_name, clip_data});
    }
}

async function addSessionSync() {
    // This function registers some events, as to talk with other tabs
    // For now, this is useful for clipboard sync, but we probably can have more.
    const PROBE_TIMEOUT_MS = 200;
    let session_channel = new BroadcastChannel("ale_session");

    // Receive data
    session_channel.onmessage = (msg) => {
        let data = msg.data;
        let kind = data.kind;
        // New ALEI instance started up.
        if (kind == "start") {
            if (aleiSessionID == null) return;
            session_channel.postMessage({kind: "greet", id: aleiSessionID});
            aleiLog(DEBUG, "/ale_session/ recieved start");
        }
        // An ALEI instance responded to new ALEI instance, registering the ALEI instance
        if (kind == "greet") {
            let session_id = data.id;
            if (!aleiSessionList.includes(session_id))
                aleiSessionList.push(session_id);
            aleiLog(DEBUG, "/ale_session/ received greet by " + session_id);
        }
        // An ALEI instance is closing
        if (kind == "close") {
            let session_id = data.id;
            aleiSessionList.splice(aleiSessionList.indexOf(session_id), 1);
            aleiLog(DEBUG, "/ale_session/ received close by " + session_id);
        }
    }

    // Probe for other sessions
    session_channel.postMessage({kind: "start"});
    aleiLog(DEBUG, "/ale_session/ probing");
    await new Promise(resolve => {
        JS_setTimeout(resolve, PROBE_TIMEOUT_MS);
    });

    // Assign own session ID
    if (aleiSessionList.length == 0)
        aleiSessionID = 0;
    else
        aleiSessionID = Math.max(...aleiSessionList) + 1;

    aleiLog(DEBUG, "/ale_session/ session ID " + aleiSessionID);

    // Tell other sessions that this one is done
    window.addEventListener('beforeunload', (event) => {
        session_channel.postMessage({kind: "close", id: aleiSessionID});
    });

    addClipboardSync();
}

function addPropertyPanelResize() {
    // Gives right panel ability to be resized.

    let splitter_is_down = false;
    const splitter = document.createElement("div");
    const root = document.documentElement;

    splitter.style.position = "absolute";
    splitter.style.width = "5px";
    splitter.style.top = "50px";
    splitter.style.height = "100%";
    splitter.style.cursor = "w-resize";
    // splitter.style["background-color"] = "black";
    $id('floattag').appendChild(splitter);

    function splitter_resize(e) {
        let new_width = Math.min(root.clientWidth - 100, Math.max(100, root.clientWidth - e.clientX));
        right_panel.style.width = new_width + 'px';
        splitter.style.right = new_width + 'px';
        ROOT_ELEMENT.style.setProperty("--param_panel_size", splitter.style.right);
        updateBoxSplitterSize();
    }

    splitter.addEventListener('mousedown', (e) => {
        splitter_is_down = true;
    });

    root.addEventListener('mouseup', (e) => {
        splitter_is_down = false;
        writeStorage('ALEI_RightPanelWidth', right_panel.clientWidth + 'px');
    });

    root.addEventListener('mousemove', (e) => {
        if (splitter_is_down) splitter_resize(e);
    });

    splitter.style.right = aleiSettings.rightPanelSize;
    ROOT_ELEMENT.style.setProperty("--param_panel_size", splitter.style.right);
    window.splitter = splitter;
}

function addTriggerIDs() {
    if (!aleiSettings.showTriggerIDs) return;

    let SVTTP = special_values_table['trigger_type'];
    for (let i in SVTTP) {
        SVTTP[i] = i + " " + SVTTP[i];
    }
}

function patchShowHideButton() {
    let og = window.ShowHideObjectBox;
    window.ShowHideObjectBox = function() {
        og();
        let rparams = $id("rparams");
        let heightOffset = {true: 270, false: 155}[ObjectBox_visible];
        if (rparams != null) {
            heightOffset = Math.round(rparams.getBoundingClientRect().top + 13);
        }
        // We then set variable and call original function.
        document.documentElement.style.setProperty("--ALEI_RPARAMS_HEIGHT", `calc(100vh - ${heightOffset}px)`);
        //og();
    }
    ShowHideObjectBox();
    ShowHideObjectBox(); // Hacky way to fix bug
}

function addSnappingOptions_helper() {
    // Remove default snapping options except for "1", we will replace it them later
    $query(`a[onmousedown="GridSnappingSet(50);"]`).remove();
    $query(`a[onmousedown="GridSnappingSet(100);"]`).remove();

    let newHTML = ""
    let snappingOptions = [
        1,  5, 10,
        40, 50, 100
    ];

    for (let snappingIndex in snappingOptions) {
        let snapping = snappingOptions[snappingIndex];

        if ((snappingIndex % 3 == 0) && (snappingIndex != 0)) {
            // We have to break into new row.
            newHTML += "<br>";
        }

        let element = document.createElement("a");
        // Set relevant attributes.
        element.innerHTML = snapping / 10;
        let toolClass = "tool_btn";
        if (GRID_SNAPPING == snapping) {
            toolClass = "tool_btn2";
        }
        element.setAttribute("class", `${toolClass} tool_wid`);
        element.setAttribute("style", "width: 21px;");
        element.setAttribute("onmousedown", `GridSnappingSet(${snapping})`);
        newHTML += element.outerHTML;
        // Add to main HTML.
    }
    // Replace original `1` snapping with new HTML.
    $query(`a[onmousedown="GridSnappingSet(10);"]`).outerHTML = newHTML;
}

window.ALEI_UpdateRematchUIDSetting = function(value) {
    aleiSettings.rematchUID = value;
    writeStorage("ALEI_RemapUID", value + 0);
    UpdateTools();
}

function addRematchUIOptions_helper() {
    $query(`a[onmousedown="EvalSet('param_panel_size',800);SaveBrowserSettings();UpdateCSS();"]`).remove();

    let result = document.evaluate("//span[contains(., 'Param')]", left_panel, null, XPathResult.ANY_TYPE, null);
    result.iterateNext();
    result.iterateNext().innerHTML = "Remap UID";

    for (let value of [[true, "Yes", 0], [false, "No", 200]]) {
        let element = document.createElement("a");
        element.innerHTML = value[1];

        let toolClass = "tool_btn";
        if(aleiSettings.rematchUID == value[0]) toolClass = "tool_btn2";

        element.setAttribute("class", `${toolClass} tool_wid`);
        element.setAttribute("style", "width: 64px;");
        element.setAttribute("onmousedown", `ALEI_UpdateRematchUIDSetting(${value[0]})`);

        $query(`a[onmousedown="EvalSet('param_panel_size',${value[2]});SaveBrowserSettings();UpdateCSS();"]`).outerHTML = element.outerHTML;
    }

}

function onToolUpdate() {
    addSnappingOptions_helper();
    addRematchUIOptions_helper();
}

function patchUpdateTools() {
    let ut = UpdateTools;
    window.UpdateTools = function() {
        ut();
        onToolUpdate();
    }
    UpdateTools();
    aleiLog(DEBUG, "Patched updateTools.");
}

function tryToNumber(x) {
    if (!isNaN(Number(x))) {
        return Number(x);
    } else {
        return x;
    }
}

function insertXML(xml) {
    xml = "<map>" + xml.replaceAll("&", "[__Amp]") + "</map>";

    let parser = new DOMParser();
    let map = parser.parseFromString(xml, "application/xml");
    let objects = map.querySelectorAll("*");

    for (let i = 1; i < objects.length; i++) {
        let object = objects[i];
        if (object.tagName == "map") continue;

        let eo = new E(object.tagName);
        eo.pm = {};

        for (let j = 0; j < object.attributes.length; j++) {
            let name = object.attributes[j].name;
            let value = object.attributes[j].value;

            eo.pm[name] = tryToNumber(value.replaceAll("[__Amp]", "&"));
        }

        es.push(eo);
    }

    need_redraw = 1;
    need_GUIParams_update = 1;
}

function exportXML() {
    let exportSelection = 0;
    let newstr = "";
    let download = document.createElement("a");

    for (let i = 0; i < es.length; i++) {
        if (es[i].selected) {
            exportSelection = 1;
        }
    }

    if (exportSelection) {
        for (let i = 0; i < es.length; i++) {
            if (es[i].selected) {
                newstr += compi_obj(i);
            }
        }

        if (mapid) {
            download.download = mapid + " (selection).xml";
        } else {
            download.download = "newmap (selection).xml";
        }
    } else {
        for (let i = 0; i < es.length; i++) {
            if (es[i].exists) {
                newstr += compi_obj(i);
            }
        }

        if (mapid) {
            download.download = mapid + ".xml";
        } else {
            download.download = "newmap.xml";
        }
    }

    download.href = "data:text," + escape(newstr);

    if (newstr) {
        download.click();
    } else {
        alert("Map is empty.");
    }

    download.remove();
}
///////////////////////////////
const _ignoredKeys = [
    // Numbers obviously cannot have texts.
    "x",
    "y",
    "w",
    "h",
    "maxcalls",
    "command",
    "upg",
    "tox",
    "toy",
    "stab",
    "damage",
    "u",
    "v",
    "sx",
    "sy",
    "r",
    "f",
    "power",
    // Booleans obviously cannot have texts.
    "enabled",
    "flare",
    // We are obviously not going to change UID
    "uid",
    // We are obviously not going to change models
    "gun_model",
    "model",
];
function updateUIDReferences(oldName, newName) {
    aleiLog(DEBUG2, `Updating UID references from ${ANSI_CYAN}${oldName}${ANSI_RESET} to ${ANSI_CYAN}${newName}${ANSI_RESET}`);
    for (let i = 0; i < es.length; i++) {
        let element = es[i];
        if (!element.exists) continue;
        let properties = element.pm;

        for (let entry of Object.entries(properties)) {
            let key = entry[0];
            let value = entry[1];

            // Quick elimination
            if (_ignoredKeys.indexOf(key) !== -1) continue;
            if (typeof(value) !== "string") continue;
            if (value.indexOf(oldName) === -1) continue;

            // Actual replacement
            if (value === oldName) { // Fine.
                properties[key] = newName;
                continue;
            }

            let splt = value.split(",");
            for (let i = 0; i < splt.length; i++) {
                let item = splt[i];
                if (item.trim() == oldName) {
                    splt[i] = item.replace(oldName, newName);
                }
            }
            properties[key] = splt.join(",");
        }
    }
    window.need_GUIParams_update = true;
}

function UpdatePhysicalParam(paramname, chvalue) {
    lcz();
    var layer_mismatch = false;
    var list_changes = '';
    for (var elems = 0; elems < es.length; elems++)
        if (es[elems].exists && es[elems].selected)
            if (es[elems].pm.hasOwnProperty(paramname)) {
                if (MatchLayer(es[elems])) {
                    if (paramname == "uid" && aleiSettings.rematchUID) {
                        updateUIDReferences(es[elems].pm.uid, chvalue);
                    }

                    var lup = (typeof(paramname) == 'string') ? '"' + paramname + '"' : paramname;
                    if (typeof(chvalue) == 'number' || ((chvalue === 0))) {
                        lnd('es[' + elems + '].pm[' + lup + '] = ' + es[elems].pm[paramname] + ';');
                        ldn('es[' + elems + '].pm[' + lup + '] = ' + chvalue + ';');
                        es[elems].pm[paramname] = Number(chvalue);
                    } else if (typeof(chvalue) == 'string') {
                        lnd('es[' + elems + '].pm[' + lup + '] = "' + es[elems].pm[paramname] + '";');
                        ldn('es[' + elems + '].pm[' + lup + '] = "' + chvalue + '";');
                        es[elems].pm[paramname] = chvalue;
                    } else {
                        alert('Unknown value type: ' + typeof(chvalue));
                    }
                    list_changes += 'Parameter "' + paramname + '" of object "' + (es[elems].pm.uid != null ? es[elems].pm.uid : es[elems]._class) + '" was set to "' + chvalue + '"<br>';
                } else layer_mismatch = true;
            } need_redraw = true;
    NewNote('Operation complete:<br><br>' + list_changes, note_passive);
    if (layer_mismatch) NewNote('Note: Some changes weren\'t made due to missmatch of active layer and class of selected objects', note_neutral);
    lfz(false);
}

let imageContextMap = {};
window.aleiContextRenameImage = function(id) {
    var v = prompt('New name:', imageContextMap[id]);
    CloseImageContext();
    if ( v !== null ) {
        ServerRequest(`a=get_images&for_class=${last_for_class}&set_title_for=${id}&value=${v}`, "rename_image");
    }
}
window.aleiContextDeleteImage = function(id) {
    let v = confirm(`Are you sure you want to delete ${imageContextMap[id]} ?`);
    CloseImageContext();
    if ( v ) {
        last_element.style.opacity = '0.5';
        ServerRequest(`a=get_images&for_class=${last_for_class}&delete=${id}`, 'delete_image' );
    }
}

function ImageContext(id, e, old_name, element, moderator_menu, awaiting_approval=false, login='?', approver='?', is_fav_menu = false) {
    imageContextMap[id] = old_name;
    last_element = element;
    last_login = login;
    e.preventDefault();

    var image_context = document.getElementById('image_context');

    var str = '';

    if (moderator_menu) {
        str += `<div onclick="CloseImageContext(); setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&approve_for=${id}', 'approve_image' ); }, 1 );">Approve <img src="../images/ap.png" width="11" height="11"></div>`;
        str += `<div onclick="CloseImageContext(); setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&reset_status_for=${id}', 'reset_approval_image' ); }, 1 );">Reset approval status</div>`;
        str += `<div onclick="CloseImageContext(); setTimeout( function() { open_approved_decor_model = true; SaveFiltering(); search_phrase = '*by_login*'+last_login; UpdateImageList(); }, 1 );">Search for other approved images from &quot;${login}&quot;</div>`;
        str += `<div onclick="" style="color:rgba(0,0,0,0.3)">Last status change by ${approver}</div>`;
        str += `<div onclick="CloseImageContext(); setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&disapprove_for_all='+last_login, 'disapprove_image' ); }, 1 );">Disapprove all unreviewed from &quot;${login}&quot; <img src="../images/noap.png" width="11" height="11"><img src="../images/noap.png" width="11" height="11"><img src="../images/noap.png" width="11" height="11"></div>`;
        str += `<div onclick="CloseImageContext(); setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&disapprove_for=${id}', 'disapprove_image' ); }, 1 );">Disapprove <img src="../images/noap.png" width="11" height="11"></div>`;

    } else {
        //console.log( login, curlogin );

        if (login == curlogin && approver != '!') {
            str += `<div onclick="aleiContextRenameImage(${id})">Rename</div>`; // We overwrite rename action to our own.

            if (awaiting_approval) {
                str += `<div onclick="" style="color:rgba(0,0,0,0.3)">Request Approval (already done)</div>`;
                str += `<div onclick="CloseImageContext();  setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&deawait_approval_for=${id}', 'await_approval_status' ); }, 1 ); ">Exclude from approval review queue</div>`;
            } else {
                if (old_name == 'Untitled') {
                    str += `<div onclick="alert('Proper name required for custom image - you will not be available to change name once image is approved.');" style="color:rgba(0,0,0,0.3)">Request Approval (proper name required)</div>`;
                } else {
                    str += `<div onclick="CloseImageContext();  setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&await_approval_for=${id}', 'await_approval_status' ); }, 1 ); ">Request Approval <img src="../images/ap.png" width="11" height="11"></div>`;
                }
                str += `<div onclick="" style="color:rgba(0,0,0,0.3)">Exclude from approval review queue (not in queue)</div>`;
            }

            str += `<div onclick="aleiContextDeleteImage(${id})">Delete <img src="../images/noap.png" width="11" height="11"></div>`;
        } else {
            str += `<div onclick="CloseImageContext(); setTimeout( function() { open_approved_decor_model = true; SaveFiltering(); search_phrase = '*by_login*'+last_login; UpdateImageList(); }, 1 );">Search for other approved images from &quot;${login}&quot;</div>`;
        }

        str += `<span style="display:block;">&nbsp;</span>`;
        if (is_fav_menu) {
            str += `<div onclick="CloseImageContext();  setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&favorite_del=${id}', 'favorite_status' ); }, 1 ); ">Remove from favorites</div>`;
        } else {
            str += `<div onclick="CloseImageContext();  setTimeout( function() { ServerRequest('a=get_images&for_class='+last_for_class+'&favorite_add=${id}', 'favorite_status' ); }, 1 ); ">Add to favorites</div>`;
        }

    }

    image_context.innerHTML = str;

    image_context.style.left = e.clientX;
    image_context.style.top = e.clientY;
    image_context.style.display = 'block';

    image_context_cancel_pad.style.display = 'block';

    return false;
}

function findObjects(name) {
    let exact = confirm("Exact name?");
    let notFound = 1;

    function pred(d) {
        if (exact) {return d == name;}
        else {return d.includes(name)}
    }

    for (let i = 0; i < es.length; i++) {
        es[i].selected = 0;

        if (es[i].pm.uid) {
            if (pred(es[i].pm.uid) && MatchLayer(es[i])) {
                es[i].selected = 1;
                notFound = 0;
            }
        }
    }

    need_GUIParams_update = 1;
    need_redraw = 1;

    return notFound;
}

document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.code == "KeyS") {
        e.preventDefault();
        document.getElementsByClassName("field_btn")[0].click();
    }

    if (e.ctrlKey && e.code == "KeyF") {
        e.preventDefault();

        let name = prompt("Find objects:", "");

        if (name !== null && name !== "") {
            let notFound = findObjects(name);

            if (notFound) {
                alert("Nothing found.");
            }
        }
    }
});

function doTooltip() {
    let tooltip = document.createElement("p");

    tooltip.style.fontSize = "16px";
    tooltip.style.fontFamily = "monospace";
    tooltip.style.color = "#eee";
    tooltip.style.backgroundColor = "#000";
    tooltip.style.padding = "10px";
    tooltip.style.width = "fit-content";
    tooltip.style.borderRadius = "4px";
    tooltip.style.wordBreak = "break-all";
    tooltip.style.position = "absolute";
    tooltip.style.left = "100px";
    tooltip.style.top = "-100px";

    document.body.append(tooltip);

    document.addEventListener("mousemove", e => {
        if (e.target.title) {
            e.target.dataset.title = e.target.title;
            e.target.title = "";
        }

        if (e.target.parentElement.title) {
            e.target.parentElement.dataset.title = e.target.parentElement.title;
            e.target.parentElement.title = "";
        }
        let leftOffset = 150

        if (e.target.dataset.title) {
            let to = e.target.dataset.title.length
            tooltip.style.left = to + leftOffset + e.clientX + 20 + "px";
            tooltip.innerHTML = e.target.dataset.title;

            if (tooltip.getBoundingClientRect().height != 31) {
                tooltip.style.left = to + leftOffset + e.clientX - 20 - tooltip.getBoundingClientRect().width + "px";
            }
        } else if (e.target.parentElement.dataset.title) {
            let to = e.target.parentElement.dataset.title.length
            tooltip.style.left = to + leftOffset + e.clientX + 20 + "px";
            tooltip.style.top = e.clientY + "px";
            tooltip.innerHTML = e.target.parentElement.dataset.title;

            if (tooltip.getBoundingClientRect().height != 31) {
                tooltip.style.left = to + leftOffset + e.clientX - 20 - tooltip.getBoundingClientRect().width + "px";
            }
        } else {
            tooltip.style.left = -100 + leftOffset + "px";
            tooltip.style.top = "-100px";
        }
    });
    aleiLog(DEBUG, "Added tooltip.")
}

function patchDecorUpload() {
    // Allows for multiple uploads.
    let imageLoader = $id("imageLoader");
    // First we make it allow multiple files and remove original event listener.
    imageLoader.setAttribute("multiple", true);
    imageLoader.removeEventListener("change", handleImage);
    // Then we register our own.
    imageLoader.addEventListener("change", function(e) {
        let files = e.target.files;
        NewNote(`ALEI: Will upload ${files.length} bg/decor(s).`, "#2595FF");
        for (let file of files) {
            let arg = {target: {files: [file]}};
            handleImage(arg); // Call original function
        }
    }, false)
}

function setParameter(index, value) {
    let rightParams = document.getElementById("rparams");

    rightParams.childNodes[index].childNodes[1].innerHTML = value;
}

function getSelection() {
    let objects = [];

    for (let i = 0; i < es.length; i++) {
        if (es[i].selected && es[i].exists) {
            objects.push(es[i]);
        }
    }

    return objects;
}

function areObjectsOfSameType(objects) {
    let same = 1;

    for (let i = 0; i < objects.length; i++) {
        if (objects[i]._class != objects[0]._class) {
            same = 0;
        }
    }

    return same;
}

function removeSameItems(array) {
    return Array.from(new Set(array));
}

function removeItems(array, items) {
    let copy = JSON.parse(JSON.stringify(array));

    for (let i = 0; i < items.length; i++) {
        copy.splice(copy.indexOf(items[i]), 1);
    }

    return copy;
}

function parameterNamesToIndexes(parameters, objectParameters) {
    let indexes = [];

    for (let i = 0; i < parameters.length; i++) {
        indexes.push(objectParameters.indexOf(parameters[i]));
    }

    return indexes;
}

function getSameParameters(objects) {
    let differentParameters = [];
    let parameters = Object.keys(objects[0].pm);

    for (let i = 0; i < objects.length; i++) {
        for (let j = 0; j < parameters.length; j++) {
            if (objects[i].pm[parameters[j]] != objects[0].pm[parameters[j]]) {
                differentParameters.push(parameters[j]);
            }
        }
    }

    differentParameters = removeSameItems(differentParameters);
    differentParameters = removeItems(parameters, differentParameters);

    return parameterNamesToIndexes(differentParameters, parameters);
}

function toBoolean(str) {
    if (isNaN(Number(str))) {
        return str == "true";
    } else {
        return Boolean(str);
    }
}

function fixIndex(index, objectType) {
    let fixedIndex = index;

    if (objectType == "trigger") {
        if (index > 4) {
            fixedIndex = index + Math.floor((index - 2) / 3);
        }
    }

    return fixedIndex;
}

const parameterMap = {
    "box": {"m": "box_model"},
    "door": {
        "moving": "bool",
        "vis": "bool"
    },
    "region": {"use_on": "region_activation"},
    "decor": {
        "f": "draw_in_front",
        "model": "decor_model"
    },
    "bg": {
        "s": "bool",
        "f": "draw_in_front",
        "m": "bg_model"
    },
    "water": {"friction": "bool"},
    "trigger": {"enabled": "bool"},
    "timer": {"enabled": "bool"},
    "gun": {
        "command": "team+any",
        "upg": "gun_upgrade",
        "model": "gun_model"
    },
    "barrel": {"model": "barrel_model"},
    "lamp": {"flare": "bool"},
    "vehicle": {"model": "vehicle_model"}
}

function fixParameterValue(name, value, objectType) {
    let fixedValue;

    if (special_values_table[name]) {
        fixedValue = special_values_table[name][value];
    } else {
        if (parameterMap[objectType] && parameterMap[objectType][name]) {
            fixedValue = special_values_table[ parameterMap[objectType][name] ][value];
        }else if (name.slice(0, 8) == "actions_" && name.slice(-5) == "_type") {
            fixedValue = special_values_table["trigger_type"][value];
        }else {
            fixedValue = value;
        }
    }

    return fixedValue;
}

function setSameParameters() {
    let objects = getSelection();

    if (areObjectsOfSameType(objects) && objects.length >= 2) {
        let indexes = getSameParameters(objects);
        let parameters = Object.keys(objects[0].pm);

        for (let i = 0; i < indexes.length; i++) {
            let name = parameters[indexes[i]];
            let value = objects[0].pm[parameters[indexes[i]]];
            let objectType = objects[0]._class;

            setParameter(fixIndex(indexes[i], objectType), fixParameterValue(name, value, objectType));
        }
    }
}

function assignObjectIDs() {
    if (!aleiSettings.showIDs) return;
    let idmap = {};
    for (let element of es) {
        if (!element.exists) continue;
        if (idmap[element._class] === undefined) idmap[element._class] = -1;

        idmap[element._class] += 1;
        element.aleiID = idmap[element._class];
    }
}

function patchANI() {
    let oldAni = ani;
    window.ani = function() {
        let ngpu = need_GUIParams_update;
        oldAni();
        if (ngpu) {
            assignObjectIDs();
            if (aleiSettings.showSameParameters) {
                setSameParameters();;
            }
        }
    }
    aleiLog(DEBUG, "Patched ANI");
}

///////////////////////////////

function updateBoxSplitterSize() {
    let obj = $id("gui_objbox");
    let rect = obj.getBoundingClientRect();
    let style = splitter2.style;
    style.setProperty("width", rect.width);
    style.setProperty("left", rect.x);
    style.setProperty("top", rect.bottom);
}

function addObjBoxResize() {
    let obj = $id("gui_objbox");
    let splitter = document.createElement("div");
    window.splitter2 = splitter;
    let style = splitter.style;
    $id("floattag").appendChild(splitter);

    style.setProperty("position", "absolute");
    style.setProperty("height", "5px");
    style.setProperty("cursor", "s-resize");

    updateBoxSplitterSize();

    let splitterClicking = false;
    splitter.onmousedown = ((e) => {splitterClicking = true});
    ROOT_ELEMENT.addEventListener("mouseup", (e) => {splitterClicking = false});
    ROOT_ELEMENT.addEventListener("mousemove", (e) => {
        if (!splitterClicking) return;

        let new_height = e.clientY - 90;
        obj.style.height = new_height;
        updateBoxSplitterSize();
        ShowHideObjectBox();
        ShowHideObjectBox();
    });
    aleiLog(DEBUG, "Added splitter for object box.");
}

function patch_m_down() {
    let og_mdown = window.m_down;
    window.m_down = function(e) {
        let previousEsLength = es.length;
        og_mdown(e);
        if (es.length > previousEsLength) { // New element is made.
            assignObjectIDs();
            let element = es[es.length - 1];
            if (!("x" in element.pm)) return;
            // We now have to do job of fixPos, we cannot set fixPos to have it argument-based directly because of scoping
            // So we have to do it ourselves.
            let pm = element.pm;
            let round = function(num) {
                return Math.round(num / GRID_SNAPPING) * GRID_SNAPPING
            }
            pm.x = round(pm.x);
            pm.y = round(pm.y);
            if (element._isresizable) {
                pm.w = round(pm.w);
                pm.h = round(pm.h);
            }
            // Now we just update.
            window.need_GUIParams_update = true;
            UpdateGUIObjectsList();
        }
    }
}

function patchEntityClass() {
    let og_E = E;
    window.E = function(_class) {
        let result = new og_E(_class);
        result.fixPos = function() {}; // For proper snapping.
        return result;
    }
    aleiLog(DEBUG, "Patched entity.");
}

function PasteFromClipBoard(ClipName) {
    var clipboard = new Object();
    if (sessionStorage[ClipName] == undefined) {
        return false;
    }
    clipboard = unserialize(sessionStorage[ClipName]);
    lcz();
    for (var i = 0; i < es.length; i++)
        if (es[i].exists) {
            if (es[i].selected) {
                ldn('es[' + i + '].selected=false;');
                lnd('es[' + i + '].selected=true;');
                es[i].selected = false;
            }
        } var min_x = 0;
    var max_x = 0;
    var min_y = 0;
    var max_y = 0;
    i = 0;
    var from_obj = es.length;
    while (typeof(clipboard[i]) !== 'undefined') {
        var newparam = es.length;
        ldn('es[' + newparam + '].exists=true;');
        lnd('es[' + newparam + '].exists=false;');
        es[newparam] = new E(clipboard[i]._class);
        for (param in clipboard[i]) {
            es[newparam][param] = clipboard[i][param];
        }
        if (typeof(es[newparam].pm.x) !== 'undefined')
            if (typeof(es[newparam].pm.y) !== 'undefined') {
                if (i == 0) {
                    min_x = es[newparam].pm.x;
                    min_y = es[newparam].pm.y;
                    max_x = es[newparam].pm.x;
                    max_y = es[newparam].pm.y;
                    if (typeof(es[newparam].pm.w) !== 'undefined')
                        if (typeof(es[newparam].pm.h) !== 'undefined') {
                            min_x += es[newparam].pm.w / 2;
                            max_x += es[newparam].pm.w / 2;
                            min_y += es[newparam].pm.h / 2;
                            max_y += es[newparam].pm.h / 2;
                        }
                } else {
                    min_x = Math.min(min_x, es[newparam].pm.x);
                    min_y = Math.min(min_y, es[newparam].pm.y);
                    max_x = Math.max(max_x, es[newparam].pm.x);
                    max_y = Math.max(max_y, es[newparam].pm.y);
                    if (typeof(es[newparam].pm.w) !== 'undefined')
                        if (typeof(es[newparam].pm.h) !== 'undefined') {
                            max_x = Math.max(max_x, es[newparam].pm.x + es[newparam].pm.w);
                            max_y = Math.max(max_y, es[newparam].pm.y + es[newparam].pm.h);
                        }
                }
            } i++;
    }
    ldn('m_drag_selected=true;');
    ldn('paint_draw_mode=true;');
    ldn('quick_pick_ignore_one_click=true;');
    lnd('m_drag_selected=false;');
    lnd('paint_draw_mode=false;');
    lnd('quick_pick_ignore_one_click=false;');
    ldis = true;
    paint_draw_mode = true;
    quick_pick_ignore_one_click = true;
    lmdrwa = lmwa;
    lmdrwb = lmwb;
    // Original code by Prosu
    let m_pos_x = lmwa;
    let m_pos_y = lmwb;

    m_drag_x = mouse_x;
    m_drag_y = mouse_y;
    m_down_x = m_pos_x;
    m_down_y = m_pos_y;
    var x1 = Math.round((m_pos_x) / GRID_SNAPPING) * GRID_SNAPPING;
    var y1 = Math.round((m_pos_y) / GRID_SNAPPING) * GRID_SNAPPING;
    var lo_x = Math.round((x1 - (min_x + max_x) / 2) / GRID_SNAPPING) * GRID_SNAPPING;
    var lo_y = Math.round((y1 - (min_y + max_y) / 2) / GRID_SNAPPING) * GRID_SNAPPING;

    for (var i2 = from_obj; i2 < es.length; i2++) {
        if (typeof(es[i2].pm.uid) !== 'undefined') {
            var old_uid = es[i2].pm.uid;
            es[i2].exists = false;
            es[i2].pm.uid = RandomizeName(es[i2].pm.uid);
            es[i2].exists = true;
            for (var i3 = from_obj; i3 < es.length; i3++) {
                for (param in es[i3].pm) {
                    if (typeof(es[i3].pm[param]) == 'string') {
                        if (es[i3].pm[param] == old_uid) {
                            es[i3].pm[param] = es[i2].pm.uid;
                        }
                    }
                }
            }
        }
        if (typeof(es[i2].pm.x) !== 'undefined')
            if (typeof(es[i2].pm.y) !== 'undefined') {
                lnd('es[' + i2 + '].pm.x=' + es[i2].pm.x + ';');
                lnd('es[' + i2 + '].pm.y=' + es[i2].pm.y + ';');
                es[i2].pm.x += lo_x;
                es[i2].pm.y += lo_y;
                es[i2].fixPos();
                ldn('es[' + i2 + '].pm.x=' + es[i2].pm.x + ';');
                ldn('es[' + i2 + '].pm.y=' + es[i2].pm.y + ';');
            }
    }
    // Again by Prosu
    x1 = Math.round((m_pos_x - m_down_x) / GRID_SNAPPING) * GRID_SNAPPING;
    y1 = Math.round((m_pos_y - m_down_y) / GRID_SNAPPING) * GRID_SNAPPING;
    for (var i = 0; i < es.length; i++) {
        if (es[i]._isphysical && es[i].exists && es[i].selected && (MatchLayer(es[i]) || paint_draw_mode)) {
            es[i].pm.x += x1;
            es[i].pm.y += y1;
        }
    }
    m_down_x += x1;
    m_down_y += y1;
    lfz(false);
    return true;
}

function ServerRequest_handleMapData(mapCode) {
    // Branch of patchServerRequest
    // Made to deal with map source related things.
    aleiLog(DEBUG, "Parsing map source now.");

    const objectKeyValueRegex = /(\w+)=((-?\d+(\.\d+)?)|('[ -~]*')|true|false)/;
    const objectCreationRegex = /q=es\[\d+\]=new E\('(\w+)'\)/;

    let expressions = mapCode.split(";\n");

    let currentElement = null;

    window.es = new Array(); // clear.
    let index = 2; // We skip var q; and es = new Array();
    for (;index < expressions.length; index++) {
        let expression = expressions[index];

        // Skip if it's just only tab or newlines
        if(expression.replaceAll("\n", "").replaceAll("\t", "").length == 0) {continue};

        // Map ID related stuff.
        if (expression.indexOf("mapid = '") != -1) {
            window.mapid = expression.split(" = ")[1].slice(1, -1);
            mapid_field.value = mapid;
            continue;
        }
        else if (expression == "\t\tmapid_field.value = mapid") {continue;}
        else if (expression.indexOf("maprights.innerHTML='") != -1) {
            let rights = expression.split(";")[0].split(".innerHTML=")[1].slice(1, -1);
            maprights.value = rights;
            NewNote(`Map '${mapid}' has been successfully loaded.`, note_good);
            continue
        }
        // Actual mapdata.
        if(expression.indexOf(";q=q.pm;") != -1) { // Creation which is q=es[...]=new E(...);q=q.pm;q.(...)=(...);
            let creation = objectCreationRegex.exec(expression);
            currentElement = new E(creation[1]);
            es[es.length] = currentElement;

            let splt = expression.split(";");
            if (splt.length > 3) {
                // There is supposed to be only 3 ;'s
                // initializing;setting;firstProperty
                // Assuming that server only gives first property and does not send more than 1 in creation line
                aleiLog(WARN, `Expected 3 items, got ${splt.length} - ${splt}`);
                continue;
            }
            expression = splt[2];
        };
        // Key value
        // In format of q.(___)=(___);
        let matchKeyValue = objectKeyValueRegex.exec(expression);

        if (matchKeyValue === null) {
            aleiLog(WARN, `Unable to figure out what kind of code is "${expression}", you MIGHT have issues.`);
            continue;
        }
        let key = matchKeyValue[1];
        let value = matchKeyValue[2];
        if (value[0] != "'") { // Not a string.
            if (value == "true") value = true;
            else if(value == "false") value = false;
            else if(value.indexOf(".") != -1) value = parseFloat(value);
            else value = parseInt(value);
        } else {
            // Is a string. We just strip quotation marks and fix apostrophes.
            value = value.slice(1, -1).replaceAll("\\'", "'");
        }
        currentElement.pm[key] = value;

    }
}

function handleServerRequestResponse(request, operation, response) {
    if (response.indexOf("var es = new Array();") != -1) {
        ServerRequest_handleMapData(response);
    }else if (response.indexOf("knownmaps = [") !== -1) {
        window.knownmaps = [];
        for (let map of response.match(/"(.*?)"/g)) {
            knownmaps.push(map.slice(1, -1))
        }
        aleiLog(DEBUG, `Updated knownmaps with ${knownmaps.length} maps`);
    }else {
        aleiLog(DEBUG2, `Evaling for request ${ANSI_YELLOW}"${request}"${ANSI_RESET} with operation of ${ANSI_YELLOW}"${operation}"${ANSI_RESET}: ${response}`)
        try {JS_eval(response);}
        catch(e) {NewNote("Eval error!", note_bad); console.error(e);}
    };
}

function makeRequest(method, url, data) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve({status: 200, response: xhr.response});
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send(data);
    });
}

function updateDecorList() {
    try {
        let list_native = $id("list_native");
        for(let i = 0; i < ALEI_decors.length; i++) {
            let decor = ALEI_decors[i];
            let decor_model = decor[0];
            let decor_name = decor[1];
            let decor_image = decor[2];
            list_native.innerHTML += `
                    <div class="img_option" onClick="CustomImageSelected('${decor_model}', '${decor_name}' )">
                       <div class="imgdiv" style="background:url(${decor_image})"></div>
                       <div>
                         ${decor_name}
                       </div>
                    </div>
                    `
        }
        aleiLog(DEBUG, "Updated decor list.");
    }
    catch(e) {} // We assume we are not in decor list yet.
}

async function ALEI_ServerRequest(request, operation, callback = null) {
    let response = await makeRequest("POST", `e_server.php?a=${request_a}`, request);
    if (response.status != 200) {
        if (operation == 'save') NewNote('Oops! Error occoured during saving. Usually it may be happening due to connection problems. Map will be temporary saved to your computer\'s LocalStorage', note_bad);
        else if (operation == 'load') NewNote('Oops! Error occoured durning loading. Usually it may be happening due to connection problems.', note_bad)
        return;
    }
    try {
        handleServerRequestResponse(request, operation, response.response);
        if (request.indexOf("a=get_images") != -1 && request.indexOf("for_class=decor_model") != -1) {
            updateDecorList();
        }
        window.ImageContext = ImageContext;
        if (operation == 'save' || operation == 'load') {
            changes_made = false;
            if (operation == 'load') {
                need_redraw = true;
                need_GUIParams_update = true;
                ClearUndos();
            }
        }
    } catch (e) {
        console.error(e);
        NewNote('Server responds with unclear message. Looks like one of recent actions wasn\'t successful.', note_bad);
        debugger;
    }
    if (callback != null) {
        callback();
    }
}

let _serverRequestPatched = false;
function patchServerRequest() {
    // This code just exists to prevent logging more than once
    if (_serverRequestPatched) return;
    _serverRequestPatched = true;
    // Patches ServerRequest function.
    // vanilla ServerRequest function literally eval()'s every single thing that server sends.
    // Which opens up to expected vulnerabilities.
    // Hopefully in future, ALEI will completely get rid of eval.
    window.ServerRequest = ALEI_ServerRequest;
    aleiLog(DEBUG, "Patched ServerRequest");
}

window.eval = function(code) { // Temporarily overriding eval so we can patch ServerRequest as early as possible
    if (window.ServerRequest !== undefined) { // ServerRequest is defined.
        handleServerRequestResponse(null, null, code);
        patchServerRequest();
        // We are pretty much done, we have patched ServerRequest, so just roll with old eval.
        // Oh and a note for myself incase i confuse myself: vanilla ServerRequest is synchronous
        window.eval = JS_eval;
    } else {
        // Is not defined.
        // Is this even possible in normal circumstances?
        console.log(code);
        debugger;
    }
};

function patchUpdateGUIParams() {
    let _origUGP = window.UpdateGUIParams;
    let origGPV = window.GenParamVal;
    let origUGP = _origUGP;

    window.UpdateGUIParams = function() {
        origUGP = _origUGP;
        window.GenParamVal = function(base, value) {
            let resp = origGPV(base, value);

            if (base == "nochange") {
                resp = `${value}`.replaceAll('"', "&quot;");
                resp = `<pvalue real="${resp}">- not used -</pvalue>`
            }
            return resp;
        }
        let selected = getSelection();
        let shouldDisplayID = (selected.length == 1) && aleiSettings.showIDs;

        if (shouldDisplayID) {
            origUGP = origUGP.toString();
            origUGP = origUGP.replace("if ( i >= 4 && (i-4) % 3 == 0 ) {", "if (i >= 5 && (i - 5) % 3 == 0) {")
            eval(origUGP);
            origUGP = UpdateGUIParams;
            //selected[0].pm.__id = selected[0].aleiID;
            let entries = Object.entries(selected[0].pm);
            entries.splice(0, 0, ["__id",  selected[0].aleiID ]);
            selected[0].pm = Object.fromEntries(entries);
        }
        origUGP();
        if (shouldDisplayID) delete selected[0].pm.__id;
        window.GenParamVal = origGPV;
    }
    aleiLog(DEBUG, "Patched UpdateGUIParams");
}

function patchEvalSet() {
    window.EvalSet = function(key, value) {
        // No evaling. Death to eval! (except for when i want to use it...)
        window[key] = value;
        UpdateTools();
    }
    aleiLog(DEBUG, "Patched EvalSet");
}

window.ALEI_settingsMenu = undefined;


/*
TODO: Text field for those.
let aleiSettings = {
    triggerEditTextSize:readStorage("ALEI_EditTextSize",      "12px",  (val) => val + "px"  ),
    starsImage:         readStorage("ALEI_StarImage",    "stars2.jpg", (val) => val         ),
}
*/

function createALEISettingsMenu() {
    let mainWindow = document.createElement("div");
    mainWindow.setAttribute("class", "mrpopup");

    let title = document.createElement("div");
    title.innerHTML = "ALEI Setting";
    title.setAttribute("id", "mrtitle"); // Eric, what is this crap ?
    mainWindow.appendChild(title);


    let box = document.createElement("div");
    box.setAttribute("id", "mrbox");
    mainWindow.appendChild(box);

    // Style class.
    let aleiStyles = document.createElement("style");
    aleiStyles.innerHTML = `
    .ALEI_settingMenuText {
        font-size: 14px;
        width: 150px;
        height: 20px;
        background-color: #476082;
        color: #bfcad9;
        border-radius: 4px;
        text-align: center;
        display: inline-block;
    }
    .ALEI_settingsMenuButton {
        background-color: #26354a;
        color: #c1c9d3;
        border-radius: 5px;
        border: 1px solid #26354a;
        width: 70px;
        height: 20px;
        font-size: 14px;
        text-align: center;
        display: inline-block;
        margin-right: 4px;
    }
    .ALEI_settingsMenuButton:hover {
        background-color: #596a83;
        color: #f5faff;
    }
    .ALEI_settingMenuButtonClicked {
        background-color: #91a5c1;
        color: #fbfbfb;
    }
    `
    document.head.appendChild(aleiStyles);

    // Convenience functions.
    function addText(text) {
        let div = document.createElement("div");
        div.innerHTML = text;
        div.setAttribute("class", "ALEI_settingMenuText");
        box.innerHTML += "<br>";
        box.innerHTML += div.outerHTML;
    }
    function registerButton(general, values, key) {
        aleiSettingButtonsMap[general] = [values, key];
    }
    function addButton(display, identifier, callback) {
        aleiButtonClicks["setting_" + identifier] = callback;

        let button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("id", "ALEI_" + identifier);
        button.setAttribute("value", display);
        button.setAttribute("onclick", `aleiButtonClicks['setting_${identifier}'](); ALEI_settingUpdateButtons();`);
        button.setAttribute("class", "ALEI_settingsMenuButton");

        box.innerHTML += button.outerHTML;
    }
    function addBinaryOption(truthyVal, falsyVal, storage, key, internalName) {
        function _apply(val) {
            writeStorage(storage, val);
            aleiSettings[key] = val;
        }
        addButton(truthyVal, `${internalName}_true`, () => _apply(true));
        addButton(falsyVal, `${internalName}_false`, () => _apply(false));
    }

    // Log level.
    function logApply(val) {
        writeStorage("ALEI_LogLevel", val);
        aleiSettings.logLevel = val;
    }
    registerButton("log", [0, 1, 2], "logLevel");
    addText("Log Level:");
    addButton("INFO", "log_0", () => logApply(0));
    addButton("DEBUG", "log_1", () => logApply(1));
    addButton("DEBUG2", "log_2", () => logApply(2));

    // Action IDs.
    registerButton("actionid", [true, false], "showTriggerIDs");
    addText("Action IDs:")
    addBinaryOption("Show", "Hide", "ALEI_ShowTriggerIDs", "showTriggerIDs", "actionid")

    // Tooltips.
    registerButton("tooltip", [true, false], "enableTooltips");
    addText("Tooltips:")
    addBinaryOption("Show", "Hide", "ALEI_ShowTooltips", "enableTooltips", "tooltip")

    // Object ID.
    registerButton("showids", [true, false], "showIDs");
    addText("Object IDs:")
    addBinaryOption("Show", "Hide", "ALEI_ShowIDs", "showIDs", "showids")

    // Show same parameters.
    registerButton("sameparams", [true, false], "showSameParameters");
    addText("Same Parameters:");
    addBinaryOption("Show", "Hide", "ALEI_ShowSameParameters", "showSameParameters", "sameparams");

    window.ALEI_settingsMenu = mainWindow;
    document.body.appendChild(mainWindow);
    ALEI_settingUpdateButtons();
}

let aleiSettingButtonsMap = {}

window.ALEI_settingUpdateButtons = () => {
    let defaultClass = "ALEI_settingsMenuButton";
    let clickedClass = "ALEI_settingsMenuButton ALEI_settingMenuButtonClicked";

    for (let entry of Object.entries(aleiSettingButtonsMap)) {
        let identity = entry[0];
        let values = entry[1][0];
        let key = entry[1][1];

        let currentVal = aleiSettings[key];
        for (let value of values) {
            $query(`#ALEI_${identity}_${value}`).setAttribute("class", defaultClass);
        }
        $query(`#ALEI_${identity}_${currentVal}`).setAttribute("class", clickedClass);
    }
}


function showSettings() {
    if (ALEI_settingsMenu === undefined) createALEISettingsMenu();

    mrdimlights.style.display = 'block';
    ALEI_settingsMenu.style.display = 'block';
    dim_undo = "ALEI_settingsMenu.style.display = 'none'";
};

let ALE_start = (async function() {
    'use strict';
    // Handling rest of things
    addPropertyPanelResize();
    addObjBoxResize();

    updateStyles();
    updateSkins();
    updateSounds();
    updateVoicePresets();
    updateParameters();
    updateOffsets();
    updateObjects();
    updateButtons();
    patch_m_down();
    await addSessionSync();
    addTriggerIDs();
    patchShowHideButton();
    optimize();
    patchUpdateTools();
    patchDecorUpload();
    patchEntityClass();
    patchEvalSet();
    // Allowing for spaces in parameters.
    window.UpdatePhysicalParam = UpdatePhysicalParam;
    window.PasteFromClipBoard = PasteFromClipBoard;
    patchANI();
    // Tooltip.
    if(aleiSettings.enableTooltips) {
        doTooltip();
    }
    patchServerRequest();
    patchUpdateGUIParams();
    NewNote("ALEI: Welcome!", "#7777FF");
    aleiLog(INFO, "Welcome!")
});

document.addEventListener("DOMContentLoaded", () => ALE_start());
