/**
 * This script will cycle through your Kaltura Media Entities,
 * check to see if they have more than 1 flavor asset,
 * and remove the Source flavor asset if it exists.
 */
const readline = require('readline');
const xml2js = require('xml2js');
const KUtil = require('./kutil');
const CONF = require('./config.json');

const MEDIA_PAGE_SIZE = 50;
const DELETE_WAIT_TIME_MS = 500;

// disable all delete operations
let DRY_RUN = true;
let YES_TO_ALL = false;

if (process.argv[2] === '--confirm') {
	DRY_RUN = false;
}

const timerMsg = 'Deleted the source assets';

const rl = readline.createInterface(process.stdin, process.stdout);
console.time(timerMsg);
// start the script
run();

async function run() {
	// ensure we have a session
	if (!CONF.session) {
		throw new Error('Place a valid session value in a file named `config.json`');
	}

	await processMediaPage(0);
	rl.close();
	console.timeEnd(timerMsg);
}

async function processMediaPage(pageNumber) {
	const resp = await getMediaEntities(pageNumber);
	let entities = resp.xml.result.objects.item || [];
	
	const total = parseInt(resp.xml.result.totalCount);
	const startIndex = pageNumber * MEDIA_PAGE_SIZE;
	let endIndex = startIndex + MEDIA_PAGE_SIZE;
	if (endIndex > total) {
		endIndex = total;
	}
	logg(`Cleaning up assets for media entities ${startIndex} through ${endIndex} out of ${total}`);
	
	if (Array.isArray(entities)) {
		entities = entities;
	} else {
		entities = [entities.id];
	}

	// for each entity in the list of entity IDs
	let succeeded = false;
	try {
		logg(`Checking ${entities.length} media entities for source flavors`);
		for (const entity of entities) {
			const id = entity.id;
			// convert dates from seconds to ISO8601 format
			entity.createdAt = new Date(parseInt(entity.createdAt) * 1000).toJSON();
			entity.updatedAt = new Date(parseInt(entity.updatedAt) * 1000).toJSON();
			// read the entity's flavo
			logg(`Accessing media entity ${id} flavors`);
			const flavorData = await getFlavorsForEntityId(id);

			let flavors = flavorData.xml.result.objects.item;
			if (!Array.isArray(flavors)) {
				flavors = [flavors];
			}
			if (flavors.length === 1) {
				logg(`Skipping entity with only 1 flavor asset`);
				continue;
			}
			// for each flavor, check to see if it is the Source asset
			for (let flavor of flavors) {
				// remove the original flavor
				if (flavor.isOriginal === '1') {

					let allowDelete = YES_TO_ALL;
					if (!YES_TO_ALL) {
						logg('Deleting source asset for media entity:');
						console.log(entity);
						// ask the script runner if they'd like to continue
						const answer = await askQuestion(
							`Are you sure you want to delete media entity ${id} flavor asset ${flavor.id}? (yes/no/all)`
						);
						if (answer === 'all') {
							YES_TO_ALL = true;
							allowDelete = true;
						}
						if (answer === 'yes') {
							allowDelete = true;
						}
					}
					// skip if user decides not to delete
					if (!allowDelete) {
						continue;
					}

					// don't delete anything unless the user explicitly passes in the --confirm arg
					if (DRY_RUN) {
						logg(`Dry run, not deleting ${flavor.id}`);
						continue;
					}

					// make the request to remove the Source asset
					logg(`Deleting entity ${id} flavor asset ${flavor.id}`);
					const flavorRes = await KUtil.makeRequest(KUtil.kaltura.flavorAssetDelete, {
						method: 'POST',
						form: {
							ks: CONF.session,
							id: flavor.id
						}
					});
					logg('Waiting 1 second before deleting the next media flavor asset');
					await sleep(DELETE_WAIT_TIME_MS);
				}
			}
		}
		succeeded = true;
	} catch (err) {
		console.error(err);
		logg('Failed to remove all source flavor assets');
	}

	if (succeeded && entities.length === MEDIA_PAGE_SIZE) {
		// get the next page
		logg(`Checking for more media entities, page ${pageNumber + 1}`);
		await processMediaPage(pageNumber + 1);
	}
}

function sleep(n) {
	return new Promise(resolve => {
		setTimeout(resolve, n || 2000);
	});
}

async function getMediaEntities(pageIndex) {
	const resp = await KUtil.makeRequest(KUtil.kaltura.mediaList, {
		method: 'POST',
		form: {
			ks: CONF.session,
			filter: {
				objectType: 'KalturaMediaEntryFilter',
				orderBy: '-createdAt'
			},
			pager: {
				pageIndex: pageIndex,
				// default 30, max 500
				pageSize: MEDIA_PAGE_SIZE
			}
		}
	});
	const parser = new xml2js.Parser({
		explicitArray: false
	});
	return await parser.parseStringPromise(resp.body);
}

async function getFlavorsForEntityId(entityId) {
	const resp = await KUtil.makeRequest(KUtil.kaltura.flavorAssetList, {
		method: 'POST',
		form: {
			ks: CONF.session,
			'filter[objectType]': 'KalturaFlavorAssetFilter',
			'filter[entryIdEqual]': entityId
		}
	});
	var parser = new xml2js.Parser({
		explicitArray: false
	});
	return await parser.parseStringPromise(resp.body);
}



function logg(msg) {
	console.log(`${new Date().toJSON()} ${msg}`);
}

function askQuestion(question) {
	return new Promise(resolve => {
		rl.question(question, resolve);
	});
}