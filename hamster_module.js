// Hamster module — deps injected by hamsterInit()
let db, saveData, addKittens, removeKittens, getKittens, ensureUser;
let EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PREFIX, client;

// ── Hamster data ───────────────────────────────────────────
const HAMSTER_DATA = {
  Bijou:   { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Bijou.gif",    description: "A graceful hamster with a signature blue bow. Elegant and a little fancy.",                    personality: "princess"        },
  Boss:    { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Boss.gif",     description: "Tough on the outside, soft on the inside. Don't let him fool you.",                          personality: "gruff"           },
  Cappy:   { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Cappy.gif",    description: "Always wearing his cap. Ready for adventure at a moment's notice.",                          personality: "adventurous"     },
  Dexter:  { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Dexter.gif",   description: "The bookish type. Probably knows more than you.",                                           personality: "smart"           },
  Hamtaro: { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Hamtaro.gif",  description: "The star of the show. Energetic, lovable, and always hungry for sunflower seeds.",           personality: "energetic"       },
  Howdy:   { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Howdy.gif",    description: "Y'all ready for this? Howdy's got jokes. Mostly bad ones.",                                  personality: "goofball"        },
  Maxwell: { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Maxwell.gif",  description: "Thoughtful and poetic. Often lost in his own little world.",                                 personality: "dreamy"          },
  Oxnard:  { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Oxnard.gif",   description: "A round, cheerful ham who loves sunflower seeds more than life itself.",                     personality: "chubby_cheerful" },
  Panda:   { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Panda.gif",    description: "Black and white and adorable all over. Very shy but very sweet.",                            personality: "shy"             },
  Penelope:{ stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Penelope.gif", description: "Tiny and quiet. Communicates mostly in happy squeaks.",                                      personality: "quiet"           },
  Sandy:   { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Sandy.gif",    description: "An athletic gymnast hamster. She'll do a backflip for a sunflower seed.",                   personality: "athletic"        },
  Snoozer: { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Snoozer.gif",  description: "Always asleep. Like, always. You're not sure if he's even alive.",                          personality: "sleepy"          },
  Stan:    { stock: 3, price: 500, gif: "https://raw.githubusercontent.com/PigeonHawk/ultimate-shitter-bot/main/assets/hamsters/Stan.gif",     description: "Sandy's twin brother. Loves music and showing off.",                                        personality: "showoff"         },
};

const HAMSTER_NAMES = Object.keys(HAMSTER_DATA);
const HAMSTER_MAX_PER_PLAYER = 2;
const HAMSTER_SHOP_PAGE_SIZE = 4;

// ── Stock helpers ──────────────────────────────────────────
function getHamsterStock(name) {
  if (!db.hamsterStock) db.hamsterStock = {};
  return Math.max(0, HAMSTER_DATA[name].stock - (db.hamsterStock[name] ?? 0));
}
function sellHamster(name) {
  if (!db.hamsterStock) db.hamsterStock = {};
  db.hamsterStock[name] = (db.hamsterStock[name] ?? 0) + 1;
}

// ── Player hamster helpers ─────────────────────────────────
function getHamsters(userId) {
  // Migrate legacy single-hamster field
  if (db.users[userId]?.hamster && !db.users[userId]?.hamsters) {
    db.users[userId].hamsters = [{ type: db.users[userId].hamster, nickname: db.users[userId].hamster }];
    delete db.users[userId].hamster;
    saveData(db);
  }
  return db.users[userId]?.hamsters ?? [];
}
function getHamsterCount(userId) { return getHamsters(userId).length; }

// ── Pair key ───────────────────────────────────────────────
function pairKey(a, b) { return [a, b].sort().join("_"); }

// ── Individual action responses (6 per personality) ────────
const HAMSTER_RESPONSES = {
  pet: {
    princess:        ["Bijou closes her eyes and leans into your hand, perfectly poised. 💙","She allows it. You are honoured.","Bijou tilts her head so you can scratch behind her ear. Gracious as always.","She lets out the tiniest, most dignified sigh of contentment.","Bijou gives you a slow blink of approval. High praise from royalty.","She holds perfectly still while you pet her. Like a portrait come to life."],
    gruff:           ["Boss grumbles but doesn't move away. Progress.","He side-eyes you but his tail starts wiggling. Don't tell anyone.","Boss puffs up, then immediately deflates and lets you pet him. Classic.","He pretends to be very busy with nothing in particular until your hand gets close.","Boss leans in exactly one millimeter. Massive step for him.","He closes his eyes for a second. You catch it. He knows you caught it."],
    adventurous:     ["Cappy zooms in a circle and then runs back for more pets.","He tips his cap at you. Somehow.","Cappy headbutts your hand enthusiastically. Very yes.","He pauses mid-sprint specifically to receive pets. Efficient.","Cappy climbs your arm to get closer to your hand. Determined little guy.","Cappy uses the petting as fuel and immediately runs off on a new adventure."],
    smart:           ["Dexter pauses his reading and nods approvingly.","He submits to exactly 3 pats and then returns to his book.","Dexter adjusts his glasses and tolerates the affection.","He tracks your hand with his eyes like he's taking notes.","Dexter allows it but looks like he's running calculations the whole time.","He accepts the pet, then goes back to whatever he was doing. You've been evaluated."],
    energetic:       ["Hamtaro squeaks and does a little spin!! 🌟","He zooms so fast he trips over himself. Then asks for more.","Hamtaro presses his tiny face into your palm. Maximum happiness.","He squeaks so loud the neighbors probably heard. Worth it.","Hamtaro runs a victory lap after each pet. Every single time. 🌟","Hamtaro freezes, eyes wide, then absolutely loses it with joy."],
    goofball:        ["Howdy tips an imaginary hat and then falls over.","He tells you a joke mid-pet. It was not good.","Howdy wiggles so hard he rolls off the bed. He's fine.","Howdy pretends to faint from the affection. Gets up immediately.","He narrates the petting in real time. You didn't ask for commentary.","Howdy makes it weird somehow. You still don't know how."],
    dreamy:          ["Maxwell gazes into the distance peacefully as you pet him. 🌙","He sighs contentedly and writes something in his tiny notebook.","Maxwell murmurs something poetic you can't quite hear.","He closes his eyes and stays very still, like he's memorizing the feeling.","Maxwell whispers 'yes... just like in the poem.' You don't know what poem.","He leans into it slowly, dreamily, like he's already half asleep. 🌙"],
    chubby_cheerful: ["Oxnard squeaks delightedly and offers you a sunflower seed in return. 🌻","He is so round and happy. You feel better just touching him.","Oxnard vibrates with joy. Literally vibrates.","He immediately rolls over for a belly pet. No shame whatsoever.","Oxnard's cheeks get even puffier with happiness somehow. 🌻","He pats your hand back with his tiny paw. You're best friends now."],
    shy:             ["Panda peeks out from behind his paws and then lets you pet him. 🐼","He turns bright red but doesn't run away. Growth.","Panda squeaks very quietly. That's basically a thank you.","He covers his face after. Too much happiness all at once.","Panda shuffles forward one tiny step. Enormous act of bravery.","He accepts the pet and immediately looks the other way. Overwhelmed in the best way."],
    quiet:           ["Penelope makes a tiny happy sound and presses against your hand. 🤍","She blinks at you slowly. That's hamster for 'I love you'.","Penelope tucks her nose under your finger. Precious.","She curls slightly toward you like a little crescent moon.","Penelope stays very still and just breathes quietly. Peaceful.","She makes the softest possible squeak. One. Perfect. Squeak. 🤍"],
    athletic:        ["Sandy does a little victory pose after being pet. Gold medal energy.","She cartwheels over to you, accepts the pet, cartwheels away. Efficient.","Sandy flexes her tiny arms. You pet her anyway.","She does a cool stretch beforehand like she's warming up for it.","Sandy accepts the pet with her chest puffed out. Champion stance.","She high-fives your finger on the way out. Actual high five."],
    sleepy:          ["Snoozer does not wake up. But he smiles a little. 💤","You pet him. He snores louder. This is the best outcome.","One eye opens slightly, then closes again. He appreciated it.","He shifts position in his sleep to lean closer to your hand.","Snoozer lets out a tiny dream-squeak. He's petting you back in the dream.","His paw twitches. You choose to believe that was a thumbs up. 💤"],
    showoff:         ["Stan immediately starts showing off his dance moves mid-pet. 🎵","He winks at you. You didn't ask for this.","Stan acts like he didn't love it. He loved it.","He poses dramatically while you pet him. Several poses.","Stan announces the petting to an invisible audience.","He makes meaningful eye contact the entire time. Intense. 🎵"],
  },
  feed: {
    princess:        ["Bijou accepts the seed delicately with both paws. Perfect posture.","She inspects it first. Approves. Eats gracefully.","Bijou takes the tiniest possible bite. Impeccable manners.","She chews so quietly you barely notice. Refined to the core. 💙","Bijou dabs the corner of her mouth afterward. With what, you don't know.","She accepts it like a gift at a formal banquet. You feel honored to have fed her."],
    gruff:           ["Boss snatches it out of your hand immediately. No eye contact.","He eats the whole thing in one go and pretends nothing happened.","Boss grunts. That's 'thank you' in Boss language.","He checks around first to make sure no one saw him accept kindness.","Boss eats it fast. Like if he slows down he'll have to feel something.","He takes it, walks two steps away, eats it with his back to you. Classic Boss."],
    adventurous:     ["Cappy grabs the seed like it's a treasure and buries it for later.","He eats half, pockets the rest for the journey ahead.","Cappy takes the seed and announces it as 'supplies for the expedition.'","He sniffs it, approves it, names it something adventurous. Then eats it.","Cappy stores it in his cheek and taps the side of his head. Smart.","He accepts it mid-run without breaking stride. Impressive. 🗺️"],
    smart:           ["Dexter eats it thoughtfully, probably calculating its nutritional value.","He accepts it with a dignified nod.","Dexter saves a piece for later. Always prepared.","He examines the seed from multiple angles before eating. Due diligence.","Dexter eats efficiently. No crumbs. No waste. Perfect.","He cross-references the food with some internal database before approving it."],
    energetic:       ["Hamtaro INHALES the seed and immediately wants another!! 🌟","He eats it so fast you barely saw it happen.","Hamtaro does a happy dance while chewing. Impressive multitasking.","He sprints toward the food before you've fully extended your hand.","Hamtaro eats it, squeaks, and immediately looks for the next one. 🌟","He vibrates with excitement for a full three seconds before eating it."],
    goofball:        ["Howdy tries to juggle the seed and drops it. Then eats it off the floor.","He makes a big show of eating it dramatically.","Howdy tells you a food pun while eating. It was terrible.","He pretends he wasn't hungry. Eats it in one second flat.","Howdy performs a whole bit about the seed before consuming it.","He drops it, blames you, picks it up, eats it. Doesn't apologize."],
    dreamy:          ["Maxwell eats it slowly, staring at the horizon. Deep thoughts.","He murmurs something about the 'simple beauty of sustenance.'","Maxwell chews thoughtfully and writes in his notebook with the other paw.","He holds the seed for a moment like it means something. It probably does to him.","Maxwell eats it like it's the last seed in a poem about winter. 🌙","He thanks the seed quietly before eating it. You don't mention it."],
    chubby_cheerful: ["Oxnard LIGHTS UP. This is the best day of his life. Every day. 🌻","He already had cheeks full of seeds but happily adds more.","Oxnard takes it gently, then asks if there's more with his eyes.","He does a little spin before accepting it. Pure joy.","Oxnard cradles the seed like a precious gift before eating it.","His eyes go wide and he freezes for half a second. Then absolute chaos. 🌻"],
    shy:             ["Panda creeps forward, takes it quickly, and retreats to eat in private.","He peeks at you while eating. Very cute. Very shy.","Panda blushes while accepting it. Adorable.","He waits until you look away before eating. You look away on purpose.","Panda takes it with the tips of his paws like he's afraid to touch your hand.","He eats it behind a small piece of bedding. Privacy is important to him."],
    quiet:           ["Penelope takes it with both tiny paws and eats it very carefully. 🤍","She blinks at you happily between bites.","Penelope nibbles it into the most perfect tiny pieces.","She holds it like a tiny precious object before eating.","Penelope eats in complete silence. Not a single crumb escapes.","She finishes and gives you one slow satisfied blink. 🤍"],
    athletic:        ["Sandy does a victory lap before eating. Earned it.","She eats it in record time. Personal best.","Sandy analyzes it like a protein source and approves.","She eats with focus and intention. Fueling up.","Sandy finishes, nods, and immediately starts her cooldown stretches.","She treats the feeding like a scheduled nutrition break. Very professional. 🥇"],
    sleepy:          ["Snoozer eats it in his sleep somehow. Expert level. 💤","One paw reaches out, grabs the seed, retracts. Eyes never opened.","He chews with his eyes closed. Nothing wakes this ham.","The seed disappears. You're not entirely sure how.","Snoozer rolls toward it in his sleep. Instinct is powerful.","He incorporates the feeding into his dream without missing a beat. 💤"],
    showoff:         ["Stan does a little bow before accepting the food. Always performing. 🎵","He eats it like he's in a music video.","Stan winks at you again. Still didn't ask for it.","He catches the seed mid-air dramatically. It was not thrown.","Stan eats it with the energy of a finale. Standing ovation from nobody.","He makes the eating part of the performance. The crowd loves it. The crowd is you. 🎵"],
  },
  play: {
    princess:        ["Bijou plays with the utmost dignity. She's winning and she knows it.","She bats a tiny ball around gracefully. Never breaks composure.","Bijou engages in play on her own terms. As she should.","She selects one toy, plays with it precisely, and then retires. Quality over quantity.","Bijou wins whatever game this is. The rules were hers to begin with. 💙","She bats something across the floor and watches it with regal satisfaction."],
    gruff:           ["Boss plays aggressively. He's having fun. He will deny this.","He absolutely destroys the toy, then looks away casually.","Boss is competitive even with inanimate objects. Respect.","He body-checks the toy across the room. Efficient.","Boss plays like he has something to prove. To who? The toy. The toy specifically.","He wins. Obviously. Dusts himself off. Walks away. Legendary."],
    adventurous:     ["Cappy treats every toy like a new expedition! 🗺️","He runs laps around everything and maps the entire play area.","Cappy grabs the toy and sprints away with it. It's his now.","He invents a whole quest around the toy and narrates it out loud.","Cappy discovers a corner of the play area he's never seen. It was there before.","He treats the obstacle course like a world record attempt. It might be. 🗺️"],
    smart:           ["Dexter solves the puzzle toy in 4 seconds and looks bored.","He plays strategically. You wonder if he's always this calculated.","Dexter studies the toy first. Then dominates it.","He reverse-engineers the toy before playing with it. Just to understand it.","Dexter wins with minimal effort and maximum smugness.","He finishes the game, recaps what he learned, files it away. Efficient."],
    energetic:       ["Hamtaro is ZOOMING!! He has lapped the entire room!! 🌟","He plays so hard he trips and keeps going. No stopping.","Hamtaro invites you to race. You will lose.","He bounces off the walls. Literally bounces off the walls.","Hamtaro plays with everything simultaneously somehow. 🌟","He squeaks the entire time. A constant stream of joy and speed."],
    goofball:        ["Howdy plays so chaotically you can't tell if he's winning.","He ends up tangled in the toy. Still having fun though.","Howdy treats it like a comedy bit. The toy is the straight man.","He invents rules mid-game and immediately breaks them.","Howdy loses dramatically. Demands a rematch. Loses again. Loves it.","He cheats somehow. You don't know how. The toy doesn't even have rules."],
    dreamy:          ["Maxwell plays gently and thoughtfully. Each move is intentional. 🌙","He finds poetry in the way the ball rolls. You don't get it.","Maxwell plays quietly, lost in his own imagination.","He pauses mid-play to appreciate the moment. Then continues.","Maxwell treats the toy like a collaborator rather than an object.","He plays slowly, like every movement is a sentence in a story. 🌙"],
    chubby_cheerful: ["Oxnard plays enthusiastically and then takes a snack break. Perfect. 🌻","He bounces after the toy. Slowly. Happily. Unstoppably.","Oxnard brings you the toy to throw. He's a good boy.","He runs in a circle for a while and then sits down, satisfied.","Oxnard plays and laughs at the same time. Somehow.","He forgets what he's playing and just has a great time anyway. 🌻"],
    shy:             ["Panda plays when he thinks you're not watching. You're watching.","He bats the ball once, looks around nervously, bats it again.","Panda hides behind a toy and peeks out. He thinks this is hiding.","He gets really into it for a second and then remembers you exist. Freezes.","Panda plays in tiny cautious movements that gradually get bigger.","He's having the time of his life the moment you look away. 🐼"],
    quiet:           ["Penelope plays in near-silence. Just tiny pattering sounds. 🤍","She nudges the toy gently, watches it, nudges again.","Penelope winds herself around every obstacle like water.","She plays like she's trying not to disturb the peace. She never does.","Penelope investigates each toy thoroughly before deciding to enjoy it.","She wins quietly. No celebration. Just a small satisfied look. 🤍"],
    athletic:        ["Sandy treats playtime like an Olympic event. Podium only. 🥇","She does flips over every obstacle. Unnecessary but impressive.","Sandy competes against herself and sets a new record.","She trains during playtime. Play is just training with extra steps.","Sandy does something physically impossible and then shrugs.","She finishes with a perfect landing and sticks it. Gold. 🥇"],
    sleepy:          ["Snoozer bats the toy once in his sleep and then rolls over. 💤","He is technically 'at play.' Horizontally.","The toy rolled into him. He didn't move. They played together.","Snoozer dreams about playing. This counts.","He sleepwalks through the entire play session. Still won somehow.","The toy is resting next to him now. They're both asleep. 💤"],
    showoff:         ["Stan does a full choreographed routine with the toy. Unasked for. 🎵","He plays to the imaginary crowd. You are the imaginary crowd.","Stan narrates his own play by play. In third person.","He does something incredible, looks directly at you, and smiles.","Stan treats every catch like a highlight reel moment.","He takes a bow after. There was no one asking for a bow. He bows anyway. 🎵"],
  },
  talk: {
    princess:        ["Bijou listens politely and then offers a refined opinion. 💙","She responds with perfect diction. You feel underdressed.","Bijou engages in conversation like it's a formal occasion.","She tilts her head at exactly the right moment. She's a great listener.","Bijou has thoughts. Articulate, well-organized thoughts. 💙","She responds briefly but precisely. Every word earned its place."],
    gruff:           ["Boss grunts. You feel weirdly understood.","He gives you a long look, then one nod. That's a full conversation.","Boss says nothing but somehow you got great advice.","He listens without interrupting. Rare quality. Deeply underrated.","Boss makes a sound that could mean anything. It meant exactly what you needed.","He doesn't say much but he was paying attention to every word."],
    adventurous:     ["Cappy immediately starts planning a trip based on your conversation.","He tells you about the last adventure. There are many adventures.","Cappy relates everything you said to something he's explored.","He responds with a story that starts with 'one time I was in the walls...'","Cappy suggests you both go somewhere after this. You consider it.","He listens and then pulls out a tiny map. Already on it. 🗺️"],
    smart:           ["Dexter has seven follow-up questions and a corrections list.","He listens, thinks, and gives you an answer you didn't expect.","Dexter knew what you were going to say before you said it.","He fact-checks you mid-sentence. Politely. It still stings.","Dexter offers three alternative perspectives you hadn't considered.","He responds with a counterpoint so good you forget what you originally said."],
    energetic:       ["Hamtaro responds with maximum enthusiasm for everything!! 🌟","He talks fast, interrupts himself, keeps going. You love it.","Hamtaro agrees with everything and gets excited about all of it.","He bounces while listening. Just bounces.","Hamtaro has already moved on to the next topic. Keep up. 🌟","He squeaks in the middle of your sentence because he already knows and loves it."],
    goofball:        ["Howdy turns your conversation into a bit. You walked into it.","He responds with a joke. Then another. You didn't ask.","Howdy tells you a long story that goes absolutely nowhere.","He listens and responds with a completely unrelated anecdote. Somehow it helps.","Howdy gives you advice that is objectively wrong but delivered with confidence.","He ends every response with finger guns. You've stopped questioning it."],
    dreamy:          ["Maxwell responds with something philosophical you'll think about later. 🌙","He listens with his eyes half closed and says something beautiful.","Maxwell turns everything into a metaphor. It works somehow.","He hears you out and responds like your feelings are a piece of literature.","Maxwell pauses for a long time before speaking. Worth the wait.","He says one sentence and then looks out the window. That's the whole conversation. 🌙"],
    chubby_cheerful: ["Oxnard listens intently and responds with pure warmth. 🌻","He validates everything you say. Best therapist honestly.","Oxnard cheers for you. He's not totally sure what you said but he's supportive.","He offers you a seed during the conversation. Emotional support snack.","Oxnard nods enthusiastically at everything. He's in your corner. 🌻","He doesn't fully understand but he loves you and that's enough."],
    shy:             ["Panda listens shyly and offers a small, sincere response.","He turns a little pink but he understood you perfectly.","Panda doesn't say much but what he says matters.","He listens with his whole body. Very attentive. Very quiet.","Panda whispers something. You lean in. It was exactly right.","He thinks carefully before responding. Takes it seriously. 🐼"],
    quiet:           ["Penelope communicates entirely through expressive blinks. You get it. 🤍","She is quiet but deeply attentive. You feel heard.","Penelope offers one soft squeak at just the right moment.","She listens better than anyone you know. Says nothing. Means everything.","Penelope tilts her head and the whole conversation resolves.","She responds with presence. That's enough. That's more than enough. 🤍"],
    athletic:        ["Sandy gives you a pep talk whether you wanted one or not.","She responds with actionable advice and a training regimen.","Sandy tells you that you can do it. And somehow you believe her.","She listens and then says 'okay here's the plan' and you trust it.","Sandy turns whatever you said into motivation. She's incredible.","She responds like a coach at halftime. You feel unstoppable. 🥇"],
    sleepy:          ["Snoozer murmurs something wise in his sleep. You write it down. 💤","He is asleep. But his sleeping face is very supportive.","Snoozer rolls over toward you. That means he's listening.","He responds with a dream-noise that somehow addressed your concern.","Snoozer is unconscious but radiating comfort. It helps.","He says something in his sleep that will haunt you forever. In a good way. 💤"],
    showoff:         ["Stan turns the conversation into a performance somehow. 🎵","He agrees with everything you said and then makes it about him.","Stan gestures dramatically while responding. Full theater.","He responds like he's giving an acceptance speech. You weren't giving an award.","Stan quotes himself during the conversation. Several times.","He listens, then stands up, then speaks. The standing was unnecessary. Perfect. 🎵"],
  },
  walk: {
    princess:        ["Bijou walks with perfect posture, like the path was laid out specifically for her. 💙","She stops to inspect a flower. Approves of it. Continues.","Bijou glides more than walks. You struggle to keep up gracefully.","She pauses at every puddle to ensure her bow isn't reflected unfavorably.","She arrives back looking exactly as pristine as when she left. How.","Bijou acknowledges other hamsters with a polite nod and keeps moving."],
    gruff:           ["Boss walks like he owns every inch of this path. He might.","He stops, looks around, nods once, continues. Everything has been assessed.","Boss walks slightly ahead of you. You're the backup.","He spots something suspicious. Investigates. Determines it is fine. Moves on.","Boss doesn't stroll. He patrols.","He comes back slightly winded but won't admit it. You don't mention it."],
    adventurous:     ["Cappy treats the walk like a full expedition. He packed snacks. 🗺️","He runs ahead, scouts the area, comes back, reports findings.","Cappy discovers three new things on a path you've walked a hundred times.","He maps the entire route as you go. For future reference.","He insists on taking the long way. Worth it, somehow. 🗺️","Cappy greets every landmark like an old friend."],
    smart:           ["Dexter walks at an optimal pace he calculated beforehand.","He observes everything on the route and files it away mentally.","Dexter corrects your path twice. Both times he was right.","He already knew the best route. He was just letting you figure it out.","Dexter notes three things about the environment worth studying later.","He arrives back having learned something. He always learns something."],
    energetic:       ["Hamtaro is not walking. Hamtaro is sprinting. With joy. 🌟","He laps you four times before you reach the end of the block.","Hamtaro stops to investigate everything and still finishes first.","He squeaks the entire walk. A running commentary of delight.","Hamtaro zigzags the whole time. Covers three times the distance.","He comes back barely winded, already asking when the next walk is. 🌟"],
    goofball:        ["Howdy walks into one thing immediately. Gets up. Keeps going.","He takes a detour for no reason and ends up exactly where he needed to be.","Howdy greets every passerby whether they want to be greeted or not.","He trips over flat ground, dusts off, announces he meant to do that.","Howdy turns the walk into a parade. Just the two of you. He's in front.","He gets distracted by a bug and you're not sure he remembers the walk."],
    dreamy:          ["Maxwell walks slowly, taking in everything. The walk is the point. 🌙","He stops to watch a leaf fall. You wait. It was worth waiting for.","Maxwell murmurs something about the light hitting the ground just right.","He walks with his eyes half closed, guided by feeling.","Maxwell finds meaning in the route. You're not sure how. It's a parking lot.","He comes back looking peaceful. The walk did something for him. 🌙"],
    chubby_cheerful: ["Oxnard is very excited about the walk. And the path. And the air. 🌻","He waddles with enthusiasm. Speed is not the point. Joy is the point.","Oxnard stops to sniff everything and is delighted by all of it.","He finds a snack on the way. He had snacks. He takes both.","Oxnard waves at everyone. Everyone waves back. He's beloved.","He comes back rosy-cheeked and immediately talks about the next walk. 🌻"],
    shy:             ["Panda stays close to your side the whole walk. Safe that way.","He peeks around corners before committing to them.","Panda relaxes about halfway through. Progress.","He flinches at a loud noise, recovers, keeps going. Brave.","Panda discovers he likes the outdoors when it's quiet. Today it's quiet. 🐼","He comes back a little more confident than when he left. You notice."],
    quiet:           ["Penelope walks beside you in perfect silence. Comfortable silence. 🤍","She notices things you walked right past. Points them out gently.","Penelope's tiny footsteps are the only sound. It's peaceful.","She stops to look at something small. You stop too. You both look.","Penelope walks with the calm of someone who is exactly where they should be.","She comes back serene. The walk settled something in her. 🤍"],
    athletic:        ["Sandy turns the walk into interval training. You try to keep up. 🥇","She power-walks, then sprints, then walks again. A full workout.","Sandy tracks the distance, pace, and elevation. Takes notes.","She adds a cool-down stretch at the end. You do it too.","Sandy treats the walk like cross-training. Because it is.","She finishes and immediately evaluates her performance. A solid walk. 🥇"],
    sleepy:          ["Snoozer walks with his eyes half closed. Still mostly asleep. 💤","He stops, naps briefly on a rock, resumes. Refreshed.","Snoozer walks slowly. Very, very slowly. You match his pace.","He falls asleep standing up at one point. You catch him. He continues.","Snoozer finds the walk deeply relaxing. So does the nap he takes halfway through.","He returns home and immediately falls into a deeper sleep. The walk worked. 💤"],
    showoff:         ["Stan struts. There's no other word for it. He struts. 🎵","He waves at everyone like he's in a parade. He is. It's his parade.","Stan stops to perform an impromptu routine mid-walk. You wait.","He walks ahead so you can admire him from behind. He turns to check.","Stan narrates the walk like it's a nature documentary about himself.","He arrives back with a fan. One new fan. From the walk. 🎵"],
  },
  bathe: {
    princess:        ["Bijou bathes like she invented hygiene. Possibly she did. 💙","She scrubs each paw individually and with intention.","Bijou emerges from the bath looking somehow even more regal.","She inspects her bow in the reflection of the water first. Satisfied.","Bijou allows exactly the right amount of water. Not a drop more.","She comes out pristine and gives you a look that suggests you try harder. 💙"],
    gruff:           ["Boss bathes quickly and efficiently. In and out. No nonsense.","He dunks his head in and shakes off aggressively. Done.","Boss scrubs like he's winning a fight. He is.","He comes out looking clean but somehow still tough.","Boss doesn't enjoy the bath. He endures it. And comes out spotless.","He shakes the water off directly at you. Deliberate. Probably."],
    adventurous:     ["Cappy treats the bath like a whitewater expedition. Splashing mandatory. 🗺️","He makes the most of it. Full submersion. Several times.","Cappy explores every inch of the bath like undiscovered territory.","He comes out soaked and thrilled. Immediately wants to go again.","Cappy narrates the bath like a dramatic river crossing.","He splashes around for way longer than necessary. For science. 🗺️"],
    smart:           ["Dexter has optimized his bathing routine down to two minutes flat.","He cleans in a logical, methodical order. Head to tail.","Dexter uses the bath time to think. Comes out clean and with solutions.","He emerges looking perfect. Of course he does.","Dexter assessed the water temperature before entering. It was correct.","He towels off with the same focus he applies to everything else."],
    energetic:       ["Hamtaro turns bathtime into a splash zone immediately. 🌟","He is in, out, in again, spinning, splashing, squeaking. Bathtime.","Hamtaro gets you wetter than he gets himself somehow.","He emerges damp and delighted and immediately starts running again.","Hamtaro treats every bubble like a personal victory. 🌟","He is clean for approximately four seconds before getting into something."],
    goofball:        ["Howdy falls into the bath immediately. Wasn't ready. Had a great time.","He splashes so much the floor is wetter than he is.","Howdy comes out with bubbles still on his head. Hasn't noticed.","He makes bath sounds. Vocal bath sounds. The whole time.","Howdy gets distracted mid-bath and has to be reminded what he was doing.","He emerges damp and chaotic and somehow happy. Standard Howdy."],
    dreamy:          ["Maxwell floats on his back for a while just looking at the ceiling. 🌙","He takes his time. The bath is a meditation.","Maxwell emerges smelling like whatever peace smells like.","He finds the sound of the water beautiful and just listens for a moment.","Maxwell comes out soft and calm, like the water washed something difficult away.","He stays in a little longer than needed. Just appreciating it. 🌙"],
    chubby_cheerful: ["Oxnard loves bathtime so much he tries to bring snacks in. 🌻","He splashes happily for much longer than necessary.","Oxnard emerges fluffy and round and absolutely gleaming.","He blows bubbles and is delighted every single time.","Oxnard treats bath time like a tiny spa day. He deserves it.","He comes out smelling amazing and looking like a fresh marshmallow. 🌻"],
    shy:             ["Panda needed some coaxing but once he's in he's okay. 🐼","He bathes quietly with the curtain pulled. Privacy respected.","Panda comes out looking clean and a little less nervous than before.","He checks that no one is watching before getting in. You look away.","Panda goes quickly but thoroughly. Efficient shyness.","He emerges with damp ears and a relieved expression. Glad that's over. 🐼"],
    quiet:           ["Penelope bathes so gently the water barely ripples. 🤍","She takes her time with each little paw. Careful and thorough.","Penelope comes out impossibly clean and soft.","She hums to herself during the bath. The quietest hum.","Penelope treats bathtime as a quiet ritual. Sacred, almost.","She emerges glowing. You don't know how. It's a bath. She glows. 🤍"],
    athletic:        ["Sandy treats the bath like a recovery session. Post-workout protocol. 🥇","She's efficient. Stretches during. Optimizes the whole thing.","Sandy emerges clean, refreshed, and ready for the next event.","She times herself. New personal best.","Sandy scrubs with the intensity of someone who takes cleanliness seriously.","She comes out looking like an athlete ready for the podium. Still. 🥇"],
    sleepy:          ["Snoozer falls asleep in the bath. Somehow doesn't sink. 💤","He baths in slow motion. Very slow motion.","Snoozer emerges damp and immediately goes back to sleep. Clean though.","He does the minimum required and returns to bed. Priorities.","Snoozer floats peacefully for a while. No complaints.","He comes out smelling like lavender and immediately starts snoring. 💤"],
    showoff:         ["Stan treats bathtime like a photoshoot. Several poses. 🎵","He emerges with his fur perfectly styled. You have no idea how.","Stan makes bathing look like a performance art piece.","He narrates his own bath. For the fans.","Stan comes out looking incredible. You wonder if he was already clean.","He exits the bath dramatically with a hair toss that shouldn't be possible. 🎵"],
  },
};

// ── All 78 pair responses (5 each) ────────────────────────
// Functions receive (a, b) where a and b are the hamsters'
// nicknames sorted alphabetically by their TYPE name.
const HAMSTER_PAIR_RESPONSES = {
  [pairKey("Bijou","Boss")]: [
    (a,b)=>`${a} holds out a paw. ${b} stares at it for ten seconds. Then shakes it exactly once. You witnessed history.`,
    (a,b)=>`${b} caught ${a}'s bow before it blew away. He didn't say anything. She noticed.`,
    (a,b)=>`${a} offers ${b} a seed delicately. ${b} takes it without eye contact. This is their love language.`,
    (a,b)=>`${b} builds ${a} a little shelter out of bedding. "It looked cold," he says. It did not look cold.`,
    (a,b)=>`${a} and ${b} share a seed in complete silence. It is the most romantic thing you've ever seen.`,
  ],
  [pairKey("Bijou","Cappy")]: [
    (a,b)=>`${b} asks ${a} if she wants to go on an adventure. She says yes, adjusts her bow, and somehow leads the whole thing.`,
    (a,b)=>`${a} watches ${b} run in a circle. "Enthusiasm," she says, "is a form of elegance."`,
    (a,b)=>`${b} finds something shiny and brings it to ${a} like a treasure. She accepts it graciously. It's a bottle cap.`,
    (a,b)=>`${a} and ${b} race. ${a} technically walks. ${a} wins. Nobody questions this.`,
    (a,b)=>`${b} trips on the way back from an adventure. ${a} does not react but is somehow already there to steady him.`,
  ],
  [pairKey("Bijou","Dexter")]: [
    (a,b)=>`${a} and ${b} have a conversation that you are not intellectually equipped to follow.`,
    (a,b)=>`${b} shows ${a} something in his notebook. She adds one note in the margin. He stares at it for three minutes.`,
    (a,b)=>`${a} corrects ${b}'s posture. He corrects her math. They are even.`,
    (a,b)=>`${b} reads aloud. ${a} listens with her eyes closed. Perfect audience.`,
    (a,b)=>`${a} teaches ${b} which fork to use. He takes notes. She is pleased.`,
  ],
  [pairKey("Bijou","Hamtaro")]: [
    (a,b)=>`${b} zooms directly into ${a}'s personal space. She does not move. He stops immediately. "Oh," he says. "Hi."`,
    (a,b)=>`${a} watches ${b} bounce off the walls. "Charming," she says, and means it.`,
    (a,b)=>`${b} offers ${a} a sunflower seed he found. She accepts it with both paws like it's a jewel. He's so happy.`,
    (a,b)=>`${a} hums something and ${b} starts dancing immediately. She continues humming. She planned this.`,
    (a,b)=>`They share a quiet moment by accident. ${b} doesn't know how to act. ${a} just smiles. Perfect.`,
  ],
  [pairKey("Bijou","Howdy")]: [
    (a,b)=>`${b} tells ${a} a joke. She gives him exactly one polite laugh. He considers this his greatest achievement.`,
    (a,b)=>`${b} does a trick for ${a}. She claps twice, precisely. He bows seventeen times.`,
    (a,b)=>`${b} tries to get ${a} to dance. She refuses. Her foot is tapping. She refuses.`,
    (a,b)=>`${a} tells ${b} his joke was "acceptable." He frames this compliment in his mind.`,
    (a,b)=>`${a} says something under her breath. ${b} hears it and cackles. She pretends she said nothing.`,
  ],
  [pairKey("Bijou","Maxwell")]: [
    (a,b)=>`${b} writes a poem for ${a}. She reads it once, nods, and folds it carefully into her bow.`,
    (a,b)=>`${a} and ${b} watch the light change. Neither speaks. This is the whole activity.`,
    (a,b)=>`${b} calls ${a} "the still point of the turning room." She allows this.`,
    (a,b)=>`${a} says something beautiful without thinking. ${b} writes it down immediately. She pretends she didn't see.`,
    (a,b)=>`${b} reads aloud. ${a}'s eyes close. Not sleeping. Listening better than anyone.`,
  ],
  [pairKey("Bijou","Oxnard")]: [
    (a,b)=>`${b} offers ${a} a snack every three minutes. She accepts every one without comment. She is full. She accepts another.`,
    (a,b)=>`${b} says ${a} is his favourite. ${a} says he is "adequate." ${b} vibrates with happiness.`,
    (a,b)=>`${b} saves ${a} the best seed. Every day. She has a collection now. She doesn't have the heart to stop him.`,
    (a,b)=>`${b} knocks something over. ${a} catches it. ${b} didn't notice. ${a} didn't tell him.`,
    (a,b)=>`${a} and ${b} take a nap together. She is upright and composed. He is a sphere. Both are asleep.`,
  ],
  [pairKey("Bijou","Panda")]: [
    (a,b)=>`${b} thinks he's bothering ${a}. He is not. She has positioned herself closer to him three times.`,
    (a,b)=>`${a} gives ${b} one nod of approval. He nearly faints.`,
    (a,b)=>`${b} leaves ${a} a flower anonymously. She knows it was him. She wears it next to her bow.`,
    (a,b)=>`${b} accidentally makes ${a} laugh. He replays this moment for the rest of the day.`,
    (a,b)=>`${a} asks ${b} for his opinion. He is startled. Gives it. It is very good. She listens carefully.`,
  ],
  [pairKey("Bijou","Penelope")]: [
    (a,b)=>`${a} and ${b} communicate entirely in slow blinks and small gestures. It's a full conversation.`,
    (a,b)=>`${b} tidies ${a}'s bow without being asked. ${a} lets her. High trust.`,
    (a,b)=>`${b} offers ${a} the quietest possible squeak of greeting. ${a} receives it formally.`,
    (a,b)=>`${b} shows ${a} something tiny she found. ${a} examines it seriously. "Beautiful," she says. And means it.`,
    (a,b)=>`They take a walk together. No words. Just two small beings moving quietly through the world.`,
  ],
  [pairKey("Bijou","Sandy")]: [
    (a,b)=>`${b} does a backflip to impress ${a}. ${a} claps once with precision. ${b} considers this a standing ovation.`,
    (a,b)=>`${b} tries to teach ${a} a cartwheel. ${a} modifies it into something more dignified. Still a cartwheel. Somehow.`,
    (a,b)=>`${a} cheers for ${b} at training. Quietly. Precisely. ${b} says it meant the most.`,
    (a,b)=>`${b} catches ${a}'s bow when the wind takes it. Perfect catch. ${a} accepts it back without a word.`,
    (a,b)=>`${a} gives ${b} form notes after a routine. ${b} implements every one immediately.`,
  ],
  [pairKey("Bijou","Snoozer")]: [
    (a,b)=>`${a} tries to wake ${b} up gently. He smiles in his sleep. She lets him keep sleeping.`,
    (a,b)=>`${b} falls asleep leaning against ${a}. She does not move for forty minutes.`,
    (a,b)=>`${a} covers ${b} with a small piece of bedding. Nobody sees this. She would deny it.`,
    (a,b)=>`${b} murmurs something in his sleep. ${a} leans in. It was a compliment. She straightens her bow.`,
    (a,b)=>`${a} watches ${b} sleep and says quietly, "honestly, fair enough." Then sits beside him.`,
  ],
  [pairKey("Bijou","Stan")]: [
    (a,b)=>`${b} performs for ${a}. She watches with the calm of a judge. He ups his game. It gets genuinely good.`,
    (a,b)=>`${a} tells ${b} his routine needs work. He agrees. He fixes it. Comes back. She nods. High bar cleared.`,
    (a,b)=>`${b} dedicates a performance to ${a}. She watches to the end. This is her highest compliment.`,
    (a,b)=>`${b} shows off. ${a} is not impressed. ${b} shows off better. She tilts her head. Getting there.`,
    (a,b)=>`${a} tells ${b} he is "the second most elegant creature in this room." He thanks her. This takes him all day.`,
  ],
  [pairKey("Boss","Cappy")]: [
    (a,b)=>`${b} runs circles around ${a}. ${a} watches. "You'll burn out," he says. ${b} runs another circle.`,
    (a,b)=>`${b} calls ${a} "the muscle." ${a} says he prefers "security consultant." ${b} just says it louder.`,
    (a,b)=>`${b} gets into something. ${a} gets him out of it. This happens at least twice.`,
    (a,b)=>`${b} brings ${a} a souvenir from his adventure. ${a} examines it. It's a rock. "Good rock," he says.`,
    (a,b)=>`${a} watches ${b}'s back on an expedition. ${b} doesn't know this. ${a} doesn't tell him.`,
  ],
  [pairKey("Boss","Dexter")]: [
    (a,b)=>`${b} corrects ${a} mid-sentence. ${a} stares. ${b} doesn't flinch. Mutual respect established.`,
    (a,b)=>`${b} figures out the plan. ${a} executes it. Perfect division of labor. Neither admits they need the other.`,
    (a,b)=>`${b} calls ${a} "surprisingly effective." ${a} calls ${b} "useful." They shake on it.`,
    (a,b)=>`${b} reads something out loud. ${a} pretends not to listen. Remembers every word.`,
    (a,b)=>`${a} guards while ${b} thinks. This is genuinely the most effective team in the room.`,
  ],
  [pairKey("Boss","Hamtaro")]: [
    (a,b)=>`${b} zooms up to ${a} and says hi seventeen times. ${a} grunts. ${b} considers them best friends.`,
    (a,b)=>`${a} catches ${b} mid-fall without thinking. Both pretend it didn't happen.`,
    (a,b)=>`${a} says something gruff. ${b} hears it as encouragement. Technically he's not wrong.`,
    (a,b)=>`${b} cheers for ${a}. About nothing specific. ${a} doesn't tell him to stop. Big step.`,
    (a,b)=>`${b} declares ${a} his hero. ${a} says nothing. His ears are pink. Stop noticing.`,
  ],
  [pairKey("Boss","Howdy")]: [
    (a,b)=>`${b} tells ${a} a joke. ${a} doesn't laugh. ${b} tells it again differently. ${a} makes a sound. Could be a laugh. Unconfirmed.`,
    (a,b)=>`${b} and ${a} get into a prank war. ${b} pranks better. ${a} recovers faster. Draw.`,
    (a,b)=>`${b} gives ${a} a nickname. ${a} hates it. ${b} uses it anyway. ${a} hates it less every day.`,
    (a,b)=>`${b} tells everyone ${a} is secretly funny. ${a} denies this. He is.`,
    (a,b)=>`${a} and ${b} share a meal. ${a} eats in silence. ${b} narrates the meal. Neither finds this weird.`,
  ],
  [pairKey("Boss","Maxwell")]: [
    (a,b)=>`${b} recites a poem. ${a} listens in full silence. "Not bad," he says. ${b} has never felt more understood.`,
    (a,b)=>`${b} is sad. ${a} sits next to him without asking why. They stay there a while.`,
    (a,b)=>`${a} protects ${b}'s notebook from getting wet. Doesn't tell him. ${b} finds it dry later.`,
    (a,b)=>`${b} writes a poem about ${a}. ${a} reads it twice. Says nothing. Keeps it.`,
    (a,b)=>`${a} and ${b} go for a late walk. ${b} notices things. ${a} notices anyone nearby. Both doing their job.`,
  ],
  [pairKey("Boss","Oxnard")]: [
    (a,b)=>`${b} offers ${a} a seed. ${a} takes it without looking. ${b} is delighted. This happens every day.`,
    (a,b)=>`${b} declares ${a} his "big tough best friend." ${a} says nothing. His tail is moving.`,
    (a,b)=>`${a} thinks nobody saw him share food with ${b}. Everybody saw.`,
    (a,b)=>`${b} brings ${a} his favourite food because he "seemed like he was having a hard day." ${a} was not. He eats it anyway.`,
    (a,b)=>`${a} and ${b} end up napping next to each other. ${a} did not plan this. He does not leave.`,
  ],
  [pairKey("Boss","Panda")]: [
    (a,b)=>`${b} is scared of something. ${a} walks over and stands in front of it. Problem handled.`,
    (a,b)=>`${a} nods at ${b}. ${b} nearly collapses. That's how you know ${a} approves.`,
    (a,b)=>`${a} and ${b} go somewhere new. ${a} checks it's safe first. Gives ${b} the all-clear. ${b} exhales.`,
    (a,b)=>`${b} tries something scary with ${a} nearby. He does it. He did it. ${a} says "yeah, figured."`,
    (a,b)=>`${a} pats ${b} on the head once. ${b} is changed by this.`,
  ],
  [pairKey("Boss","Penelope")]: [
    (a,b)=>`${b} approaches ${a} very quietly. He notices immediately. Lets her come. Doesn't startle her.`,
    (a,b)=>`${b} squeaks once at ${a}. He looks at her for a moment. Nods. She nods back. Done.`,
    (a,b)=>`${b} leaves ${a} a small gift. He carries it around for the rest of the day without mentioning it.`,
    (a,b)=>`${b} pats ${a}'s paw. He looks down at it. Looks up. Looks back down. He doesn't move.`,
    (a,b)=>`${a} and ${b} are in the same room for an hour without a single word. Both are comfortable.`,
  ],
  [pairKey("Boss","Sandy")]: [
    (a,b)=>`${b} challenges ${a} to a contest. He wins. She immediately starts training to win next time.`,
    (a,b)=>`${a} watches ${b} train and says "not bad." She hears this as a full standing ovation.`,
    (a,b)=>`${b} and ${a} spar. Neither wins. Neither stops. They call it a draw and do it again tomorrow.`,
    (a,b)=>`${a} catches ${b} when she overshoots a landing. Sets her down. Steps back. Says nothing.`,
    (a,b)=>`${b} says ${a} is "the only one who actually pushes her." He says she's "not terrible either." Romance.`,
  ],
  [pairKey("Boss","Snoozer")]: [
    (a,b)=>`${b} falls asleep on ${a}'s watch. ${a} lets him. Keeps watching for both of them.`,
    (a,b)=>`${a} is trying to be intimidating. ${b} is asleep next to him looking adorable. It undercuts things slightly.`,
    (a,b)=>`${b} murmurs something wise in his sleep. ${a} writes it down. Tells no one.`,
    (a,b)=>`${a} covers ${b} when it gets cold. Two seconds. Walks away. Nobody saw.`,
    (a,b)=>`${b} snores. ${a} doesn't complain. He's used to it. He'd miss it if it stopped.`,
  ],
  [pairKey("Boss","Stan")]: [
    (a,b)=>`${b} performs for ${a}. ${a} watches with arms crossed. ${b} turns up the volume. ${a} uncrosses his arms.`,
    (a,b)=>`${b} tries to get ${a} to dance. ${a} refuses. His foot is moving. He refuses.`,
    (a,b)=>`${b} makes a dramatic exit. ${a} is still there when he comes back. He always is.`,
    (a,b)=>`${b} dedicates his best performance to ${a}. ${a} says "it was okay." Highest praise he's given.`,
    (a,b)=>`${a} doesn't admit he looked up the song ${b} was performing. He looked it up.`,
  ],
  [pairKey("Cappy","Dexter")]: [
    (a,b)=>`${a} rushes off. ${b} hands him a map first. It's the right map. He doesn't ask how.`,
    (a,b)=>`${a} asks ${b} what that thing is. ${b} knows. ${a} runs toward it before the explanation is done.`,
    (a,b)=>`${b} researches. ${a} field-tests. Together they are one complete scientist.`,
    (a,b)=>`${a} brings back something cool. ${b} identifies it. ${a} immediately claims he knew what it was.`,
    (a,b)=>`${a} discovers something. ${b} already discovered it theoretically. He lets ${a} have this one.`,
  ],
  [pairKey("Cappy","Hamtaro")]: [
    (a,b)=>`${a} and ${b} sprint in the same direction at the same time for completely different reasons. They laugh.`,
    (a,b)=>`${a} and ${b} race. Nobody wins. Both are already distracted by something else.`,
    (a,b)=>`${a} and ${b} discover a new corner of the room. They treat this like reaching a mountain peak.`,
    (a,b)=>`${a} makes a plan. ${b} adds five things to it in thirty seconds. The plan is now better and chaotic.`,
    (a,b)=>`${a} and ${b} have been friends since the second they met. There was no warm-up period.`,
  ],
  [pairKey("Cappy","Howdy")]: [
    (a,b)=>`${a} and ${b} get into trouble together. ${b} caused it. ${a} made it worse. Beautiful teamwork.`,
    (a,b)=>`${b} turns ${a}'s expedition into a comedy bit. ${a} is in it. He's playing himself.`,
    (a,b)=>`${a} maps the route. ${b} adds labels like "HERE BE SNACKS" and "THE FUNNY BIT."`,
    (a,b)=>`${a} takes the mission seriously. ${b} takes nothing seriously. Between them: perfect balance.`,
    (a,b)=>`${a} yells "adventure!" ${b} yells something funnier. They both run anyway.`,
  ],
  [pairKey("Cappy","Maxwell")]: [
    (a,b)=>`${a} drags ${b} on an adventure. ${b} finds poetry in it. ${a} didn't expect this bonus.`,
    (a,b)=>`${a} and ${b} get lost. ${b} writes about it. ${a} maps it. They're less lost now.`,
    (a,b)=>`${a} finds something beautiful. ${b} puts it into words. ${a} says "yeah, that."`,
    (a,b)=>`${a} brings ${b} somewhere he's never been. ${b} finds seventeen things worth writing about.`,
    (a,b)=>`${b} describes ${a} as "a small force of nature who sprints." ${a} makes this his identity.`,
  ],
  [pairKey("Cappy","Oxnard")]: [
    (a,b)=>`${a} and ${b} go on an adventure. ${b} packs snacks. The snacks are the highlight.`,
    (a,b)=>`${a} runs ahead. ${b} waits. ${a} comes back. ${b} has food ready. Perfect system.`,
    (a,b)=>`${b} can't keep up with ${a}'s speed. ${a} laps him twice and comes back each time. He's not leaving him.`,
    (a,b)=>`${a} discovers something great. ${b} says "we should celebrate." He already has seeds ready.`,
    (a,b)=>`${b} says he'll try the adventure if there's a snack at the end. ${a} plants one. ${b} is proud of himself.`,
  ],
  [pairKey("Cappy","Panda")]: [
    (a,b)=>`${a} convinces ${b} to try something new. ${b} agrees. He does it. He loved it.`,
    (a,b)=>`${b} wants to explore but is scared. ${a} just starts walking like it's obvious. ${b} follows. He always does.`,
    (a,b)=>`${b} watches ${a} try something brave. Decides to try it himself. Does it. They celebrate.`,
    (a,b)=>`${b} says he doesn't like adventures. ${a} says this one is different. It always is.`,
    (a,b)=>`${a} declares ${b} the best adventure companion. ${b} turns pink and agrees to come again.`,
  ],
  [pairKey("Cappy","Penelope")]: [
    (a,b)=>`${a} sprints. ${b} pads quietly behind him. They always end up in the same place.`,
    (a,b)=>`${b} notices something ${a} ran past. She shows him. He goes back. She was right.`,
    (a,b)=>`${a} runs ahead. ${b} waits. He comes back to get her. Every time.`,
    (a,b)=>`${b} is quiet. ${a} fills the quiet well. They balance each other.`,
    (a,b)=>`${b} tucks close to ${a} on a new path. She's not scared. She just prefers it.`,
  ],
  [pairKey("Cappy","Sandy")]: [
    (a,b)=>`${a} and ${b} race. ${b} does a flip at the finish line. ${a} trips at the finish line. Both are satisfied.`,
    (a,b)=>`${a} and ${b} explore together at full speed. Bystanders are concerned. They're fine.`,
    (a,b)=>`${b} runs faster. ${a} runs farther. By different metrics, both win.`,
    (a,b)=>`${a} and ${b} have been competing since they met. Neither has clearly won. They keep going.`,
    (a,b)=>`${a} plans an adventure. ${b} turns it into a training course. It's better this way.`,
  ],
  [pairKey("Cappy","Snoozer")]: [
    (a,b)=>`${a} tries to wake ${b} up for an adventure. ${b} doesn't wake. ${a} tells him about it in full detail later.`,
    (a,b)=>`${b} naps under a tree. ${a} marks it on his map as "good spot." He's right.`,
    (a,b)=>`${a} says he'll be back by the time ${b} wakes up. He always is. ${b} never knows he was gone.`,
    (a,b)=>`${b} wakes briefly, sees where they are, nods, goes back to sleep. He trusts ${a} completely.`,
    (a,b)=>`${a} brings ${b} a souvenir from every adventure. ${b} wakes up surrounded by things he doesn't remember.`,
  ],
  [pairKey("Cappy","Stan")]: [
    (a,b)=>`${a} has the adventure. ${b} has the performance about the adventure. Between them: a full production.`,
    (a,b)=>`${b} dramatically narrates ${a}'s exploration. ${a} finds this encouraging. ${b} is glad.`,
    (a,b)=>`${a} discovers something. ${b} tells everyone. The discovery gets a name and a theme song.`,
    (a,b)=>`${a} runs. ${b} makes it look intentional. A service to the narrative.`,
    (a,b)=>`${b} performs the expedition as a one-man show. ${a} corrects one geographical error during the performance.`,
  ],
  [pairKey("Dexter","Hamtaro")]: [
    (a,b)=>`${b} asks ${a} questions faster than he can answer them. He answers them all anyway, in order.`,
    (a,b)=>`${b} says something accidentally profound. ${a} writes it down. "Did I say something smart?" "Yes." "AGAIN?!"`,
    (a,b)=>`${b} has infinite energy. ${a} has infinite patience. Together: capable of anything.`,
    (a,b)=>`${a} predicts what ${b} will do. He's right. ${b} is impressed. "How?!" "It's all in the data."`,
    (a,b)=>`${b} says ${a} is his smartest friend. ${a} says ${b} is his most interesting variable.`,
  ],
  [pairKey("Dexter","Howdy")]: [
    (a,b)=>`${b} tells a joke. ${a} explains why it's funny. This somehow makes it funnier.`,
    (a,b)=>`${b} says something silly. ${a} accidentally builds a whole theory around it. ${b} is delighted.`,
    (a,b)=>`${b} makes ${a} laugh. ${a} tries to explain why he's laughing. This also makes him laugh.`,
    (a,b)=>`${a} tells ${b} his timing is statistically off. ${b} fixes it. It's now perfect. ${a} is proud.`,
    (a,b)=>`${b} can't get a rise out of ${a}. He works harder. Gets one. Savours it.`,
  ],
  [pairKey("Dexter","Maxwell")]: [
    (a,b)=>`${a} and ${b} read the same book and have completely different and equally valid interpretations.`,
    (a,b)=>`${a} finds the logic in ${b}'s poems. ${b} finds the poetry in ${a}'s logic.`,
    (a,b)=>`${a} corrects one word in ${b}'s poem. ${b} keeps it. It's the right word.`,
    (a,b)=>`${b} and ${a} are both convinced the other is smarter. They're both right.`,
    (a,b)=>`${a} and ${b} work in the same room for an hour in silence. Neither has been this productive in weeks.`,
  ],
  [pairKey("Dexter","Oxnard")]: [
    (a,b)=>`${b} offers ${a} a snack. ${a} is about to decline. ${b} looks so happy. He takes the snack.`,
    (a,b)=>`${b} listens to ${a}'s explanation with complete focus. Then asks if there's a snack version.`,
    (a,b)=>`${a} helps ${b} with a problem. ${b} helps ${a} with lunch. Fair trade.`,
    (a,b)=>`${a} calculates. ${b} snacks. Neither is bothering the other. Perfect co-existence.`,
    (a,b)=>`${a} says ${b} is "surprisingly emotionally intelligent." ${b} says ${a} is "surprisingly fun once he eats something."`,
  ],
  [pairKey("Dexter","Panda")]: [
    (a,b)=>`${a} talks to ${b} quietly. No audience. ${b} opens up more than usual.`,
    (a,b)=>`${b} is nervous. ${a} explains there's no statistical reason to be. ${b} relaxes. Logic works sometimes.`,
    (a,b)=>`${b} asks ${a} a question he's been thinking about for a while. ${a} gives a real answer. It helps.`,
    (a,b)=>`${b} watches ${a} read and eventually picks up a book himself. ${a} doesn't comment. Good instinct.`,
    (a,b)=>`${b} says he doesn't feel judged around ${a}. ${a} says he has nothing to judge. Both mean it.`,
  ],
  [pairKey("Dexter","Penelope")]: [
    (a,b)=>`${a} and ${b} communicate differently. Together they miss nothing.`,
    (a,b)=>`${b} squeaks at the right moment in ${a}'s explanation. He takes it as a question. Answers it. He was right.`,
    (a,b)=>`${a} reads to ${b}. She seems to understand it all. He begins to suspect she's smarter than him.`,
    (a,b)=>`${b} pads over and sits next to ${a} while he works. He doesn't mind. He works better.`,
    (a,b)=>`${a} and ${b} solve a puzzle together. ${a} figures it out. ${b} had figured it out first and waited.`,
  ],
  [pairKey("Dexter","Sandy")]: [
    (a,b)=>`${b} trains. ${a} optimizes her training data. She gets faster. He's pleased.`,
    (a,b)=>`${a} tells ${b} she's performing at 94% efficiency. She wants 100. He says that's impossible. She does it anyway.`,
    (a,b)=>`${a} builds ${b} a training program. She follows it exactly. He didn't expect that. He makes a harder one.`,
    (a,b)=>`${a} watches ${b}'s form and identifies one inefficiency. She corrects it. Immediately. "How did I miss that?"`,
    (a,b)=>`${a} predicts ${b}'s performance. She exceeds it. He adjusts his models. She calls this "cheating at math."`,
  ],
  [pairKey("Dexter","Snoozer")]: [
    (a,b)=>`${a} studies ${b} as a research subject. ${b} is asleep and an excellent subject.`,
    (a,b)=>`${a} works while ${b} sleeps nearby. The ambient snoring improves his focus somehow.`,
    (a,b)=>`${b} wakes long enough to hear ${a}'s theory. Says "sounds right" and goes back to sleep. ${a} moves forward with confidence.`,
    (a,b)=>`${a} asks ${b} a question. ${b} is asleep. ${a} answers it himself. The answer is better for having said it aloud.`,
    (a,b)=>`${a} considers ${b}'s sleep schedule as a data point. The data is: a lot.`,
  ],
  [pairKey("Dexter","Stan")]: [
    (a,b)=>`${b} performs. ${a} critiques. The next performance is measurably better. ${b} will not admit this helped.`,
    (a,b)=>`${b} calls ${a} "the toughest crowd I've ever played." This is his highest compliment for an audience.`,
    (a,b)=>`${a} explains why the joke works. ${b} listens. Uses this knowledge immediately. The joke is better.`,
    (a,b)=>`${a} tells ${b} his star power is anecdotally measurable. ${b} asks for the data.`,
    (a,b)=>`${b} asks ${a} if he enjoyed the show. ${a} says "parts of it were statistically compelling." ${b} is thrilled.`,
  ],
  [pairKey("Hamtaro","Howdy")]: [
    (a,b)=>`${a} and ${b} are both talking at the same time. About different things. Both conversations are great.`,
    (a,b)=>`${b} tells a joke. ${a} laughs so hard he falls over. ${b} is thrilled. ${a} says "again."`,
    (a,b)=>`${b} makes ${a} his sidekick in a bit. ${a} is an incredible sidekick. The bit goes too well.`,
    (a,b)=>`${b} trips. ${a} trips catching him. Both squeak. Everyone around them smiles.`,
    (a,b)=>`${a} and ${b} have never had a bad interaction. It's statistically unusual.`,
  ],
  [pairKey("Hamtaro","Maxwell")]: [
    (a,b)=>`${a} says something simple. ${b} finds something profound in it. ${a} says "I was talking about seeds." "Yes," says ${b}.`,
    (a,b)=>`${b} slows ${a} down once. ${a} notices something he's never noticed. He tells ${b}. ${b} writes it down.`,
    (a,b)=>`${b} reads ${a} something. ${a} listens perfectly. His ears don't move. His eyes go wide.`,
    (a,b)=>`${a} does something joyful. ${b} finds it moving. ${a} does it again specifically for him.`,
    (a,b)=>`${b} says ${a} is "pure kinetic love." ${a} doesn't know what kinetic means. Loves the love part.`,
  ],
  [pairKey("Hamtaro","Oxnard")]: [
    (a,b)=>`${a} and ${b} are best friends and everyone can tell immediately upon seeing them.`,
    (a,b)=>`${b} always has food ready for when ${a} gets hungry. ${a} is always hungry. ${b} is always ready.`,
    (a,b)=>`${b} and ${a} share every seed. Always. Without discussion.`,
    (a,b)=>`${b} says ${a} is his best friend every day. ${a} says it back every day. They mean it every time.`,
    (a,b)=>`${a} and ${b} sit in a sunbeam together and just exist. This is everything.`,
  ],
  [pairKey("Hamtaro","Panda")]: [
    (a,b)=>`${a} goes out of his way to include ${b}. ${b} goes out of his way to show up. It works.`,
    (a,b)=>`${b} is shy. ${a} is so genuinely glad to see him that the shyness wears off quickly.`,
    (a,b)=>`${a} says ${b} is his quietest and one of his favourite friends. ${b} turns very pink.`,
    (a,b)=>`${b} is having a hard time. ${a} sits with him and just talks. It helps.`,
    (a,b)=>`${a} and ${b} walk together. ${a} at a medium pace. Unusual for ${a}. ${b} notices.`,
  ],
  [pairKey("Hamtaro","Penelope")]: [
    (a,b)=>`${a} talks. ${b} listens. He talks more. She listens more. He slows down a little. She appreciates this.`,
    (a,b)=>`${b} squeaks. ${a} immediately knows what it means. "You're hungry?" She blinks. Yes.`,
    (a,b)=>`${a} and ${b} play together. ${a} at full volume. ${b} quietly. Both having the best time.`,
    (a,b)=>`${b} is the one who calms ${a} down when he's too excited. One look. That's all it takes.`,
    (a,b)=>`${a} and ${b} fit together like noise and quiet. Neither is less than the other.`,
  ],
  [pairKey("Hamtaro","Sandy")]: [
    (a,b)=>`${a} and ${b} race. ${b} wins on form. ${a} wins on enthusiasm. Contested.`,
    (a,b)=>`${a} cheers for ${b} at training. She trains better. She won't fully admit why.`,
    (a,b)=>`${b} does a routine. ${a} claps the whole time, even the quiet bits. She keeps going.`,
    (a,b)=>`${b} teaches ${a} to slow down and breathe. He manages it for ten seconds. New record.`,
    (a,b)=>`${a} and ${b} find they work at the same pace when the goal is big enough. It usually is.`,
  ],
  [pairKey("Hamtaro","Snoozer")]: [
    (a,b)=>`${a} tries to wake ${b}. ${b} doesn't wake. ${a} curls up and naps next to him. First nap he's taken all week.`,
    (a,b)=>`${b} is asleep. ${a} tells him about his whole day. ${b} smiles. He hears more than you'd think.`,
    (a,b)=>`${a} has infinite energy. ${b} has infinite rest. They balance the universe.`,
    (a,b)=>`${b} snores. ${a} squeaks in rhythm with it. An accidental duet.`,
    (a,b)=>`${a} and ${b} are best friends despite operating on completely different frequencies.`,
  ],
  [pairKey("Hamtaro","Stan")]: [
    (a,b)=>`${a} and ${b} are both performing. Nobody asked. Nobody minds.`,
    (a,b)=>`${b} performs for ${a}. ${a} is the best audience he's ever had. Immediate standing ovation. Literal.`,
    (a,b)=>`${b} teaches ${a} a dance move. ${a} does it immediately wrong and more enthusiastically. ${b} loves it.`,
    (a,b)=>`${b} does a big finish. ${a} cheers. ${b} does another big finish. ${a} cheers louder.`,
    (a,b)=>`${a} and ${b} make everything into an event. Every event is better for it.`,
  ],
  [pairKey("Howdy","Maxwell")]: [
    (a,b)=>`${a} makes a joke. ${b} finds something genuine in it. ${a} stares. "That's not what I meant." "I know," says ${b}.`,
    (a,b)=>`${a} says something accidentally beautiful. ${b} stops. Writes it down. ${a} says "I was kidding." ${b} keeps it.`,
    (a,b)=>`${b} is in his feelings. ${a} makes him laugh. He needed that. ${a} knew.`,
    (a,b)=>`${a} says ${b} is "the deepest hamster I've ever met." ${b} says ${a} is "more profound than he knows."`,
    (a,b)=>`${a} turns something serious into a joke. ${b} turns the joke into something serious. Back to the start. Better.`,
  ],
  [pairKey("Howdy","Oxnard")]: [
    (a,b)=>`${a} tells a joke. ${b} laughs with his whole body. ${a} tells another.`,
    (a,b)=>`${a} performs for ${b}. ${b} is the perfect audience: laughs on time, gasps, claps, requests an encore.`,
    (a,b)=>`${b} loves everything ${a} does. ${a} does more because of it.`,
    (a,b)=>`${b} laughs at everything ${a} does. This is why ${a} keeps trying new things.`,
    (a,b)=>`${a} and ${b} have probably never had a bad day in each other's company.`,
  ],
  [pairKey("Howdy","Panda")]: [
    (a,b)=>`${a} tells ${b} a joke. ${b} laughs before he means to. ${a} treasures this.`,
    (a,b)=>`${a} does something funny. ${b} covers his face. Still laughing. ${a} does it again.`,
    (a,b)=>`${a} makes ${b} feel welcome somewhere new. ${b} doesn't forget this.`,
    (a,b)=>`${b} helps ${a} when a bit falls flat. A small kind look. ${a} recovers. Continues.`,
    (a,b)=>`${a} says ${b} is "the secret weapon of any room." ${b} turns so pink.`,
  ],
  [pairKey("Howdy","Penelope")]: [
    (a,b)=>`${a} tells a long joke. ${b} listens to all of it. He didn't expect that. The joke got better.`,
    (a,b)=>`${b} blinks at ${a}. He tries to read the blink. "Was that a laugh?" She blinks again. Yes.`,
    (a,b)=>`${a} talks more carefully than usual around ${b}. He can tell she hears it all.`,
    (a,b)=>`${a} goes too big on a bit. ${b} looks at him steadily until he brings it back down. It helps.`,
    (a,b)=>`${b} gives ${a} one piece of feedback without words. He implements it. It's his best bit yet.`,
  ],
  [pairKey("Howdy","Sandy")]: [
    (a,b)=>`${b} challenges ${a} to a race. ${a} turns the race into a comedy bit. He still loses. The bit was great.`,
    (a,b)=>`${b} trains seriously. ${a} does the commentary. She trains better.`,
    (a,b)=>`${a} tells a joke. ${b} laughs and does a cartwheel. Best reaction he's ever gotten.`,
    (a,b)=>`${b} catches ${a} when he trips. Clean catch. "Nice," he says. "Obviously," she says.`,
    (a,b)=>`${a} and ${b} make each other better: she gives him standards, he gives her lightness.`,
  ],
  [pairKey("Howdy","Snoozer")]: [
    (a,b)=>`${a} performs for ${b}. ${b} is asleep. ${a} considers this his toughest crowd. He keeps going.`,
    (a,b)=>`${b} snores at a punchline. ${a} takes this as a laugh. Best show he's done.`,
    (a,b)=>`${a} tells ${b} a joke while he sleeps. ${b} smiles. ${a} considers this a five-star review.`,
    (a,b)=>`${b} murmurs something in his sleep. ${a} writes it down. It's his best material now.`,
    (a,b)=>`${a} falls asleep mid-joke. ${b} was already asleep. The room has never been quieter.`,
  ],
  [pairKey("Howdy","Stan")]: [
    (a,b)=>`${a} and ${b} do a bit together. It goes completely off-script. It's the best thing anyone has seen.`,
    (a,b)=>`${b} steals the punchline. ${a} steals the bow. They've been doing this for weeks.`,
    (a,b)=>`${b} does the dramatic part. ${a} does the comedic part. Together: a full production.`,
    (a,b)=>`${a} and ${b} disagree on literally everything about the bit. The disagreement is funnier than the bit.`,
    (a,b)=>`${a} and ${b} are the most chaotic pairing. Also the most entertaining. Related.`,
  ],
  [pairKey("Maxwell","Oxnard")]: [
    (a,b)=>`${a} writes. ${b} puts a snack next to him. ${a} eats it without looking up. ${b} puts another.`,
    (a,b)=>`${b} listens to ${a}'s poem and says "that was nice. Do you want a seed?" ${a} says yes. He did.`,
    (a,b)=>`${a} has a hard day. ${b} doesn't ask questions. Just shares snacks. ${a} feels better.`,
    (a,b)=>`${b} says "I don't understand the poem but I like that you write them." ${a} says that's enough.`,
    (a,b)=>`${a} and ${b} take care of each other: ${a} finds meaning, ${b} finds food. Covered.`,
  ],
  [pairKey("Maxwell","Panda")]: [
    (a,b)=>`${a} and ${b} are both quiet. In the same space. With no pressure. Neither has felt this relaxed in weeks.`,
    (a,b)=>`${b} is sad. ${a} doesn't try to fix it. Writes nearby. ${b} feels less alone.`,
    (a,b)=>`${b} shows ${a} something small he made. ${a} says it's beautiful and names the specific part. ${b} glows.`,
    (a,b)=>`${a} writes about shyness. Not in a sad way. ${b} reads it and stops feeling embarrassed about it.`,
    (a,b)=>`${a} dedicates a poem to ${b}. Doesn't tell him. ${b} finds it. It's the nicest thing he's read.`,
  ],
  [pairKey("Maxwell","Penelope")]: [
    (a,b)=>`${a} and ${b} communicate in a language that is mostly silence and entirely understood.`,
    (a,b)=>`${b} sits beside ${a} while he writes. He writes his best work today.`,
    (a,b)=>`${b} blinks once at the end of the poem. ${a} takes this as the review. It's enough.`,
    (a,b)=>`${a} finds the words for something ${b} already knew. She blinks. "Yes," says the blink.`,
    (a,b)=>`${a} says ${b} is the most attentive audience he's ever had. She blinks. She already knew.`,
  ],
  [pairKey("Maxwell","Sandy")]: [
    (a,b)=>`${b} trains. ${a} writes about it. She trains better, knowing it's being noticed.`,
    (a,b)=>`${b} asks ${a} to describe what he sees when she trains. He does. She's moved.`,
    (a,b)=>`${a} writes a poem about movement. ${b} reads it. It's the best thing she's read. She won't say that.`,
    (a,b)=>`${b} does a perfect landing. ${a} is the only one who says exactly the right thing about it.`,
    (a,b)=>`${b} says ${a} sees things differently. He says she moves differently. They mean the same thing.`,
  ],
  [pairKey("Maxwell","Snoozer")]: [
    (a,b)=>`${a} writes beside ${b} while he sleeps. The ambient peace improves the work.`,
    (a,b)=>`${b} murmurs something in his sleep. ${a} uses it as an epigraph. The poem is his best.`,
    (a,b)=>`${a} reads aloud. ${b} is asleep. He reads more carefully. Someone should.`,
    (a,b)=>`${b} wakes once, hears ${a} writing, sighs peacefully, returns to sleep. Highest review.`,
    (a,b)=>`${a} says ${b} is "living in the poem." ${b} has no idea. He's asleep. He is.`,
  ],
  [pairKey("Maxwell","Stan")]: [
    (a,b)=>`${b} performs. ${a} finds something real in it. ${b} didn't know it was there. Now he performs it on purpose.`,
    (a,b)=>`${a} writes. ${b} performs the writing. It's better performed. ${a} considers this.`,
    (a,b)=>`${a} tells ${b} his performance has depth. ${b} practices having more. He finds it.`,
    (a,b)=>`${b} performs ${a}'s poem. ${a} watches. Doesn't say anything. But he's back the next time.`,
    (a,b)=>`${b} takes a bow. ${a} is already writing about the bow. ${b} finds the poem. Frames it.`,
  ],
  [pairKey("Oxnard","Panda")]: [
    (a,b)=>`${a} offers ${b} a seed. ${b} takes it. This is how their friendship started. Also how every day starts.`,
    (a,b)=>`${b} is nervous somewhere new. ${a} says it's great here. ${b} tries one thing. It is great.`,
    (a,b)=>`${b} is having a hard time. ${a} offers food and company. Both are accepted. Both help.`,
    (a,b)=>`${b} blushes when ${a} compliments him. ${a} keeps complimenting him. He likes the blush.`,
    (a,b)=>`${a} says ${b} is one of his favourite people. ${b} covers his face. ${a} says it again.`,
  ],
  [pairKey("Oxnard","Penelope")]: [
    (a,b)=>`${a} offers ${b} a seed. She takes it carefully. He watches to make sure she likes it. She blinks warmly. He beams.`,
    (a,b)=>`${a} gives ${b} the best seed he has. She saves half. Gives it back later. He eats it.`,
    (a,b)=>`${a} makes ${b} feel noticed. Not loudly. Just completely.`,
    (a,b)=>`${b} brings ${a} something small and interesting. He gives it a name, three cheers, and eats a seed to celebrate.`,
    (a,b)=>`${a} and ${b} are two of the kindest creatures in the room and they know it about each other.`,
  ],
  [pairKey("Oxnard","Sandy")]: [
    (a,b)=>`${b} trains. ${a} brings snacks for after. This is his contribution to athletic excellence.`,
    (a,b)=>`${a} tries to run with ${b}. He gets winded in eleven seconds. She waits. He catches up. She says "good job."`,
    (a,b)=>`${b} does a flip. ${a} drops his seed in surprise. "Do it again." She does. He drops another.`,
    (a,b)=>`${a} makes ${b} a victory snack after every training. She looks forward to this more than the training.`,
    (a,b)=>`${a} says ${b} is the most impressive person he knows. She says he's the most enthusiastic. Both true.`,
  ],
  [pairKey("Oxnard","Snoozer")]: [
    (a,b)=>`${a} and ${b} nap together. ${a} is technically awake but full and slow. Same effect.`,
    (a,b)=>`${b} wakes up hungry. ${a} already has seeds waiting. How did he know.`,
    (a,b)=>`${b} falls asleep on ${a}. ${a} doesn't move for an hour. He's also a little sleepy.`,
    (a,b)=>`${b} murmurs the name of a food. ${a} already has it. Great timing. Every time.`,
    (a,b)=>`${a} and ${b} are proof that "doing nothing together" is a valid friendship activity.`,
  ],
  [pairKey("Oxnard","Stan")]: [
    (a,b)=>`${b} performs. ${a} is the best audience. Enthusiastic, loud, snacking. ${b} loves him for it.`,
    (a,b)=>`${b} dedicates a show to ${a}. ${a} cries a little. He was eating a seed. Both things happened.`,
    (a,b)=>`${b} does a post-show bow. ${a} starts a "one more!" chant. Just him. It works.`,
    (a,b)=>`${b} says ${a} is "the warmest crowd he's ever played to." ${a} says "I was eating." ${b} knows.`,
    (a,b)=>`${a} and ${b} make everything a celebration. The room is better for it.`,
  ],
  [pairKey("Panda","Penelope")]: [
    (a,b)=>`${a} and ${b} communicate entirely without words. It's a complete and full language.`,
    (a,b)=>`${a} watches ${b} and realises he's not the only one who finds the world a bit much sometimes. He feels better.`,
    (a,b)=>`${b} and ${a} take turns being brave. It balances out perfectly.`,
    (a,b)=>`${a} tries something new. ${b} follows. Neither would have done it alone.`,
    (a,b)=>`${a} gives ${b} a small flower. She keeps it. He wonders if she noticed. She did.`,
  ],
  [pairKey("Panda","Sandy")]: [
    (a,b)=>`${b} shows ${a} something brave she does. He watches. Next day he tries something brave. Smaller. Still brave.`,
    (a,b)=>`${b} asks ${a} to try something athletic. He does one part of it. She cheers. He does the second part.`,
    (a,b)=>`${a} is nervous. ${b} says "okay but do it anyway." He does. It helps.`,
    (a,b)=>`${a} brings ${b} luck before an event. She says she doesn't need it. Takes it anyway.`,
    (a,b)=>`${a} and ${b} make each other braver. She pushes. He steadies. Needed both.`,
  ],
  [pairKey("Panda","Snoozer")]: [
    (a,b)=>`${a} tiptoes around ${b}. ${b} doesn't notice. ${a} feels good about this.`,
    (a,b)=>`${a} naps near ${b}. Feels safe. Sleeps better than usual.`,
    (a,b)=>`${a} is nervous. ${b} is asleep and calm and it is contagious. ${a} calms down.`,
    (a,b)=>`${a} covers ${b}. ${b} snores louder. More like a thank you than you'd expect.`,
    (a,b)=>`${b} sleeps. ${a} exists quietly beside him. This is their whole relationship. It's enough.`,
  ],
  [pairKey("Panda","Stan")]: [
    (a,b)=>`${b} performs. ${a} is in the front row. Doesn't cheer loudly. But he's there every time.`,
    (a,b)=>`${a} blushes when ${b} gives him attention. ${b} gives him more attention. This is his favourite game.`,
    (a,b)=>`${b} dedicates a small routine to ${a}. ${a} covers his face. Watches through his paws.`,
    (a,b)=>`${b} gets ${a} to participate in one bit. ${a} does it wrong. ${b} makes it the best part.`,
    (a,b)=>`${a} says ${b} is "very good at what he does." ${b} takes this personally. In a good way.`,
  ],
  [pairKey("Penelope","Sandy")]: [
    (a,b)=>`${b} does something loud and fast. ${a} watches with absolute calm. ${b} finds this steadying.`,
    (a,b)=>`${b} trains. ${a} watches from close by. The best thing about her audience is how still she stays.`,
    (a,b)=>`${b} asks ${a} what she thinks. ${a} blinks twice. ${b} understands. She recalibrates. It was right.`,
    (a,b)=>`${b} does a perfect landing right beside ${a}. ${a} blinks once. Gold.`,
    (a,b)=>`${a} and ${b} are both excellent in completely different ways and quietly aware of each other's excellence.`,
  ],
  [pairKey("Penelope","Snoozer")]: [
    (a,b)=>`${a} and ${b} are both very quiet. Asleep and awake: same energy. Perfect pair.`,
    (a,b)=>`${a} pats ${b} lightly. He smiles in his sleep. She knew he would.`,
    (a,b)=>`${a} squeaks softly near ${b}. He incorporates it into his dream. She blinks. She knew.`,
    (a,b)=>`${a} tucks closer to ${b}'s warmth. He doesn't wake. She blinks slowly. Perfect.`,
    (a,b)=>`${a} and ${b} together are the most serene moment you've witnessed all week.`,
  ],
  [pairKey("Penelope","Stan")]: [
    (a,b)=>`${b} performs. ${a} watches with full stillness. He does his best work under her attention.`,
    (a,b)=>`${a} blinks after ${b}'s routine. He waits. She blinks again. He takes a bow. She blinks a third time.`,
    (a,b)=>`${a} gives ${b} one look mid-performance. He self-corrects immediately. Doesn't know how she communicated it.`,
    (a,b)=>`${b} performs for ${a} specifically. She stays for all of it. This is rare. He tells no one it meant something.`,
    (a,b)=>`${a} and ${b} are an unlikely pair. Also a very good one.`,
  ],
  [pairKey("Sandy","Snoozer")]: [
    (a,b)=>`${a} trains while ${b} sleeps nearby. She's somehow less wound up when he's around.`,
    (a,b)=>`${b} wakes briefly. Sees ${a} mid-training. Smiles. Goes back to sleep. She keeps going. That smile helped.`,
    (a,b)=>`${a} finishes a difficult training session. Sits next to ${b}. The snoring is the most soothing sound she's heard today.`,
    (a,b)=>`${b} dreams about running. ${a} does it for real. Between them, everything gets covered.`,
    (a,b)=>`${a} and ${b}: one has never slept on a problem, the other has never done anything else. Between them, great results.`,
  ],
  [pairKey("Sandy","Stan")]: [
    (a,b)=>`${a} and ${b} are twins and they perform like it: perfect timing, same instincts, competing egos.`,
    (a,b)=>`${b} claims he's better. ${a} demonstrates. She is. He trains harder.`,
    (a,b)=>`${b} does a routine. ${a} does a better one immediately after. He says "okay fine." Trains for a week.`,
    (a,b)=>`${b} sings. ${a} does a floor routine to the song. Neither told the other they were doing this. Perfect.`,
    (a,b)=>`${a} catches ${b} after he overdoes a move. He lands perfectly. She releases him. Neither mentions it.`,
  ],
  [pairKey("Snoozer","Stan")]: [
    (a,b)=>`${b} performs his biggest routine. ${a} is asleep in the front row. ${b} performs louder. Still asleep.`,
    (a,b)=>`${a} wakes briefly during the show, watches for thirty seconds, says "good," returns to sleep. ${b} is moved.`,
    (a,b)=>`${b} says ${a} is "the most relaxed audience I've ever had." He's been asleep for forty minutes.`,
    (a,b)=>`${a} snores on beat. ${b} builds a whole rhythm around it. The crowd is confused and delighted.`,
    (a,b)=>`${a} and ${b}: one is always performing, one is always resting. Together they cover the full spectrum of existence.`,
  ],
};

// ── Pair response helper ───────────────────────────────────
function getPairResponse(type1, type2, nick1, nick2) {
  const key = pairKey(type1, type2);
  const pool = HAMSTER_PAIR_RESPONSES[key];
  if (!pool) return `${nick1} and ${nick2} hang out together. It's very cute.`;
  const sorted = [type1, type2].sort();
  const [nameA, nameB] = sorted[0] === type1 ? [nick1, nick2] : [nick2, nick1];
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn(nameA, nameB);
}

// ── Single action response helper ─────────────────────────
function getHamsterResponse(action, hamsterType) {
  const personality = HAMSTER_DATA[hamsterType]?.personality;
  const pool = HAMSTER_RESPONSES[action]?.[personality];
  if (!pool) return `Your hamster does something cute.`;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Shop page builder ──────────────────────────────────────
function buildShopPage(page) {
  const available = HAMSTER_NAMES.filter(n => getHamsterStock(n) > 0);
  const totalPages = Math.ceil(available.length / HAMSTER_SHOP_PAGE_SIZE) || 1;
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice = available.slice(safePage * HAMSTER_SHOP_PAGE_SIZE, (safePage + 1) * HAMSTER_SHOP_PAGE_SIZE);

  const embed = new EmbedBuilder()
    .setTitle("🐹  Hamster Shop")
    .setDescription(
      `Up to **3 of each type** available — each one is yours uniquely!\n` +
      `You can own up to **${HAMSTER_MAX_PER_PLAYER} hamsters**. Rename them with \`!hamrename\`.\n\n` +
      (slice.length > 0
        ? slice.map(n => `**${n}** — ${HAMSTER_DATA[n].description}\n*${HAMSTER_DATA[n].price.toLocaleString()} 🐱 · ${getHamsterStock(n)} remaining*`).join("\n\n")
        : "*All hamsters have been adopted! 💔*")
    )
    .setColor(0xff9ecd)
    .setFooter({ text: `Page ${safePage + 1}/${totalPages} · ${available.length} types in stock` })
    .setTimestamp();

  const rows = [];
  if (slice.length > 0) {
    rows.push(new ActionRowBuilder().addComponents(
      slice.map(n => new ButtonBuilder().setCustomId(`shop_buy_${n}`).setLabel(`🐹 ${n}`).setStyle(ButtonStyle.Primary))
    ));
  }
  if (totalPages > 1) {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`shop_page_${safePage - 1}`).setLabel("◀ Prev").setStyle(ButtonStyle.Secondary).setDisabled(safePage === 0),
      new ButtonBuilder().setCustomId(`shop_page_${safePage + 1}`).setLabel("Next ▶").setStyle(ButtonStyle.Secondary).setDisabled(safePage >= totalPages - 1),
    ));
  }
  return { embed, rows };
}

// ── Hamster display helpers ────────────────────────────────
function buildHamsterEmbed(hamObj) {
  const h = HAMSTER_DATA[hamObj.type];
  return new EmbedBuilder()
    .setTitle(`🐹  ${hamObj.nickname}${hamObj.nickname !== hamObj.type ? ` (${hamObj.type})` : ""}`)
    .setDescription(h.description)
    .setImage(h.gif)
    .setColor(0xff9ecd)
    .setFooter({ text: "Use the buttons below to interact!" })
    .setTimestamp();
}

function buildHamsterRow(hamsterType, slot) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ham_pet_${slot}_${hamsterType}`).setLabel("🤲 Pet").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`ham_feed_${slot}_${hamsterType}`).setLabel("🌻 Feed").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ham_play_${slot}_${hamsterType}`).setLabel("🎾 Play").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ham_talk_${slot}_${hamsterType}`).setLabel("💬 Talk").setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ham_walk_${slot}_${hamsterType}`).setLabel("🚶 Walk").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`ham_bathe_${slot}_${hamsterType}`).setLabel("🛁 Bathe").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ham_rename_${slot}_${hamsterType}`).setLabel("✏️ Rename").setStyle(ButtonStyle.Secondary),
    ),
  ];
}

// ── Trade + rename state ───────────────────────────────────
const pendingHamsterTrades = new Map();
const pendingHamsterRenames = new Map(); // userId → { slot, type, expiresAt }

async function hamHandleCommand(cmd, msg, args, userId, userName) {
  // ── !hamhelp ──────────────────────────────────────────────
  if (cmd === "hamhelp") {
    await msg.channel.send({ embeds: [new EmbedBuilder()
      .setTitle("🐹  Hamster Commands")
      .setDescription([
        "`!shop` — browse and adopt hamsters",
        "`!hamster` — visit your hamster(s)",
        "`!hamster @user` — peek at someone else's hamster(s)",
        "`!hamplay` — let your two hamsters hang out together",
        "`!hamrename <1 or 2> <name>` — give a hamster a nickname",
        "`!hamtrade @user [your slot] [their slot]` — propose a trade",
      ].join("\n"))
      .setColor(0xff9ecd)
      .setTimestamp()] });
  }

  // ── !shop ────────────────────────────────────────────────
  else if (cmd === "shop") {
    const { embed, rows } = buildShopPage(0);
    await msg.channel.send({ embeds: [embed], components: rows });
  }

  // ── !hamster ─────────────────────────────────────────────
  else if (cmd === "hamster") {
    const target = msg.mentions.users.first();
    const lookupId = target?.id ?? userId;
    const lookupName = target ? (msg.guild?.members.cache.get(target.id)?.displayName ?? target.username) : userName;
    ensureUser(lookupId, lookupName);
    const hams = getHamsters(lookupId);

    if (hams.length === 0) {
      const avail = HAMSTER_NAMES.filter(n => getHamsterStock(n) > 0).length;
      if (target) return msg.reply(`😢 **${lookupName}** doesn't have a hamster yet! (${avail} types in \`!shop\`)`);
      return msg.reply(`😢 You don't have a hamster yet! Visit the \`!shop\` to adopt one. (${avail} types available)`);
    }

    const isOwn = lookupId === userId;
    for (const [slot, hamObj] of hams.entries()) {
      await msg.channel.send({ embeds: [buildHamsterEmbed(hamObj)], components: isOwn ? buildHamsterRow(hamObj.type, slot) : [] });
    }
  }

  // ── !hamplay ─────────────────────────────────────────────
  else if (cmd === "hamplay") {
    ensureUser(userId, userName);
    const hams = getHamsters(userId);
    if (hams.length < 2) return msg.reply("❌ You need **2 hamsters** for them to interact! Visit `!shop` to adopt another.");
    const [h1, h2] = hams;
    const response = getPairResponse(h1.type, h2.type, h1.nickname, h2.nickname);
    await msg.channel.send({ embeds: [new EmbedBuilder()
      .setTitle(`🐹  ${h1.nickname} & ${h2.nickname}`)
      .setDescription(response)
      .setColor(0xff9ecd)
      .setTimestamp()] });
  }

  // ── !hamrename ────────────────────────────────────────────
  else if (cmd === "hamrename") {
    ensureUser(userId, userName);
    const hams = getHamsters(userId);
    if (hams.length === 0) return msg.reply("❌ You don't have any hamsters to rename!");
    const slot = parseInt(args[0]) - 1;
    const newName = args.slice(1).join(" ").trim();
    if (isNaN(slot) || slot < 0 || slot >= hams.length) {
      const list = hams.map((h, i) => `**${i + 1}.** ${h.nickname} (${h.type})`).join("\n");
      return msg.reply(`❌ Usage: \`!hamrename <1 or 2> <new name>\`\n\nYour hamsters:\n${list}`);
    }
    if (!newName) return msg.reply("❌ Please provide a name! e.g. `!hamrename 1 Peanut`");
    if (newName.length > 20) return msg.reply("❌ Name must be 20 characters or fewer!");
    db.users[userId].hamsters[slot].nickname = newName;
    saveData(db);
    await msg.reply(`✅ Your **${hams[slot].type}** has been renamed to **${newName}**! 🐹`);
  }

  // ── !hamtrade ─────────────────────────────────────────────
  else if (cmd === "hamtrade") {
    const target = msg.mentions.users.first();
    if (!target) return msg.reply("❌ Usage: `!hamtrade @user [your slot] [their slot]`");
    if (target.id === userId) return msg.reply("❌ You can't trade with yourself!");
    if (target.bot) return msg.reply("❌ You can't trade with a bot!");
    ensureUser(userId, userName);
    ensureUser(target.id, target.username);
    const myHams = getHamsters(userId);
    const theirHams = getHamsters(target.id);
    const targetName = msg.guild?.members.cache.get(target.id)?.displayName ?? target.username;
    if (myHams.length === 0) return msg.reply("❌ You don't have a hamster to trade!");
    if (theirHams.length === 0) return msg.reply(`❌ **${targetName}** doesn't have a hamster to trade!`);
    const mySlot = Math.min(Math.max((parseInt(args[1]) || 1) - 1, 0), myHams.length - 1);
    const theirSlot = Math.min(Math.max((parseInt(args[2]) || 1) - 1, 0), theirHams.length - 1);
    const myH = myHams[mySlot];
    const theirH = theirHams[theirSlot];
    for (const [, t] of pendingHamsterTrades) {
      if ([t.offererId, t.targetId].includes(userId)) return msg.reply("❌ You already have a pending trade!");
      if ([t.offererId, t.targetId].includes(target.id)) return msg.reply(`❌ **${targetName}** already has a pending trade!`);
    }
    const tradeId = `${Date.now()}_${userId}_${target.id}`;
    const sentMsg = await msg.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle("🐹  Hamster Trade Request")
        .setDescription(`**${userName}** wants to trade with **${targetName}**!\n\n🐹 **${userName}** offers: **${myH.nickname}** (${myH.type})\n🐹 **${targetName}** would give: **${theirH.nickname}** (${theirH.type})\n\n<@${target.id}> — do you accept? **30 seconds!**`)
        .setColor(0xff9ecd).setFooter({ text: "Nicknames carry over after the trade!" }).setTimestamp()],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`hamtrade_accept_${tradeId}`).setLabel("✅ Accept").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`hamtrade_deny_${tradeId}`).setLabel("❌ Deny").setStyle(ButtonStyle.Danger),
      )],
    });
    const timeout = setTimeout(async () => {
      if (!pendingHamsterTrades.has(tradeId)) return;
      pendingHamsterTrades.delete(tradeId);
      sentMsg.edit({ embeds: [new EmbedBuilder().setTitle("🐹  Trade Expired").setDescription(`⏰ **${targetName}** didn't respond — trade cancelled.`).setColor(0x95a5a6).setTimestamp()], components: [] }).catch(() => {});
    }, 30_000);
    pendingHamsterTrades.set(tradeId, { offererId: userId, offererName: userName, targetId: target.id, targetName, offererSlot: mySlot, targetSlot: theirSlot, offererHamster: myH, targetHamster: theirH, timeout, message: sentMsg });
  }

  // ── !hamsell ──────────────────────────────────────────────
  else if (cmd === "hamsell") {
    ensureUser(userId, userName);
    const hams = getHamsters(userId);
    if (hams.length === 0) return msg.reply("❌ You don't have any hamsters to sell!");

    const slot = parseInt(args[0]) - 1;
    if (isNaN(slot) || slot < 0 || slot >= hams.length) {
      const list = hams.map((h, i) => `**${i + 1}.** ${h.nickname} (${h.type})`).join("\n");
      return msg.reply(`❌ Usage: \`!hamsell <1 or 2>\`\n\nYour hamsters:\n${list}`);
    }

    const hamObj = hams[slot];
    const refund = Math.floor(HAMSTER_DATA[hamObj.type].price / 2);

    db.users[userId].hamsters.splice(slot, 1);

    if (!db.hamsterStock) db.hamsterStock = {};
    if ((db.hamsterStock[hamObj.type] ?? 0) > 0) {
      db.hamsterStock[hamObj.type]--;
    }

    addKittens(userId, refund);
    saveData(db);

    await msg.reply({ embeds: [new EmbedBuilder()
      .setTitle("🐹  Hamster Rehomed")
      .setDescription(
        `${hamObj.nickname} (${hamObj.type}) has been rehomed and returned to the shop.\n\n` +
        `💸 You received ${refund.toLocaleString()} 🐱 kittens (50% of purchase price).`
      )
      .setColor(0x95a5a6)
      .addFields({ name: "Balance", value: `${getKittens(userId).toLocaleString()} 🐱`, inline: true })
      .setFooter({ text: "Visit !shop to adopt a new companion!" })
      .setTimestamp()] });
  }
}

function registerInteractions() {
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId, user } = interaction;

  // ── Shop page nav ──────────────────────────────────────
  if (customId.startsWith("shop_page_")) {
    const { embed, rows } = buildShopPage(parseInt(customId.slice("shop_page_".length)));
    return interaction.update({ embeds: [embed], components: rows });
  }

  // ── Shop purchase ──────────────────────────────────────
  if (customId.startsWith("shop_buy_")) {
    const hamsterType = customId.slice("shop_buy_".length);
    const uId = user.id;
    const uName = interaction.member?.displayName ?? user.username;
    ensureUser(uId, uName);
    if (getHamsterCount(uId) >= HAMSTER_MAX_PER_PLAYER) {
      return interaction.reply({ content: `❌ You already own **${HAMSTER_MAX_PER_PLAYER} hamsters** — the max! Trade one away first with \`!hamtrade\`.`, ephemeral: true });
    }
    if (getHamsterStock(hamsterType) <= 0) {
      const { embed, rows } = buildShopPage(0);
      await interaction.update({ embeds: [embed], components: rows });
      return interaction.followUp({ content: `💔 **${hamsterType}** just sold out! Here's the updated shop.`, ephemeral: true });
    }
    const bal = getKittens(uId);
    const h = HAMSTER_DATA[hamsterType];
    if (bal < h.price) return interaction.reply({ content: `❌ You need **${h.price.toLocaleString()} 🐱** — you only have **${bal.toLocaleString()}**!`, ephemeral: true });
    removeKittens(uId, h.price);
    sellHamster(hamsterType);
    if (!db.users[uId].hamsters) db.users[uId].hamsters = [];
    db.users[uId].hamsters.push({ type: hamsterType, nickname: hamsterType });
    saveData(db);
    return interaction.update({ embeds: [new EmbedBuilder()
      .setTitle(`🐹  You adopted ${hamsterType}!`)
      .setDescription(`${h.description}\n\n💸 **${h.price.toLocaleString()} 🐱** deducted.\n\nUse \`!hamster\` to visit and \`!hamrename\` to give them a nickname!`)
      .setImage(h.gif).setColor(0xff9ecd)
      .addFields({ name: "Balance", value: `${getKittens(uId).toLocaleString()} 🐱`, inline: true })
      .setTimestamp()], components: [] });
  }

  // ── Hamster action buttons ─────────────────────────────
  if (customId.startsWith("ham_") && !customId.startsWith("ham_rename_")) {
    const parts = customId.split("_");
    const action = parts[1];
    const slot = parseInt(parts[2]);
    const hamsterType = parts.slice(3).join("_");
    const uId = user.id;
    const hams = getHamsters(uId);
    const hamObj = hams[slot];
    if (!hamObj || hamObj.type !== hamsterType) return interaction.reply({ content: "❌ That's not your hamster! Use `!hamster` to see your own.", ephemeral: true });
    const response = getHamsterResponse(action, hamsterType).replace(new RegExp(hamsterType, "g"), hamObj.nickname);
    const actionEmoji = { pet:"🤲", feed:"🌻", play:"🎾", talk:"💬", walk:"🚶", bathe:"🛁" };
    const actionLabel = { pet:"Pet", feed:"Feed", play:"Play", talk:"Talk", walk:"Walk", bathe:"Bathe" };
    await interaction.reply({ embeds: [new EmbedBuilder()
      .setTitle(`${actionEmoji[action]}  ${actionLabel[action]}ing ${hamObj.nickname}`)
      .setDescription(response)
      .setThumbnail(HAMSTER_DATA[hamsterType].gif)
      .setColor(0xff9ecd).setTimestamp()] });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
    return;
  }

  // ── Rename button ──────────────────────────────────────
  if (customId.startsWith("ham_rename_")) {
    const parts = customId.split("_");
    const slot = parseInt(parts[2]);
    const hamsterType = parts.slice(3).join("_");
    const uId = user.id;
    const hamObj = getHamsters(uId)[slot];
    if (!hamObj || hamObj.type !== hamsterType) return interaction.reply({ content: "❌ That's not your hamster!", ephemeral: true });
    pendingHamsterRenames.set(uId, { slot, type: hamsterType, expiresAt: Date.now() + 30_000 });
    return interaction.reply({ content: `✏️ **Renaming ${hamObj.nickname}!** Type the new name (max 20 chars) in chat within 30 seconds. Type \`cancel\` to cancel.`, ephemeral: true });
  }

  // ── Trade accept / deny ───────────────────────────────
  if (customId.startsWith("hamtrade_accept_") || customId.startsWith("hamtrade_deny_")) {
    const accepted = customId.startsWith("hamtrade_accept_");
    const tradeId = customId.slice(accepted ? "hamtrade_accept_".length : "hamtrade_deny_".length);
    const trade = pendingHamsterTrades.get(tradeId);
    if (!trade) return interaction.reply({ content: "❌ This trade has already expired or been resolved.", ephemeral: true });
    if (user.id !== trade.targetId) return interaction.reply({ content: "❌ This trade isn't for you!", ephemeral: true });
    clearTimeout(trade.timeout);
    pendingHamsterTrades.delete(tradeId);
    if (!accepted) {
      return interaction.update({ embeds: [new EmbedBuilder().setTitle("🐹  Trade Denied").setDescription(`**${trade.targetName}** declined the trade.`).setColor(0xe74c3c).setTimestamp()], components: [] });
    }
    const offHams = getHamsters(trade.offererId);
    const tarHams = getHamsters(trade.targetId);
    if (!offHams[trade.offererSlot] || offHams[trade.offererSlot].type !== trade.offererHamster.type ||
        !tarHams[trade.targetSlot] || tarHams[trade.targetSlot].type !== trade.targetHamster.type) {
      return interaction.update({ embeds: [new EmbedBuilder().setTitle("🐹  Trade Failed").setDescription("❌ Something changed between offer and accept — trade cancelled.").setColor(0xe74c3c).setTimestamp()], components: [] });
    }
    const tmp = offHams[trade.offererSlot];
    offHams[trade.offererSlot] = tarHams[trade.targetSlot];
    tarHams[trade.targetSlot] = tmp;
    db.users[trade.offererId].hamsters = offHams;
    db.users[trade.targetId].hamsters = tarHams;
    saveData(db);
    return interaction.update({ embeds: [new EmbedBuilder()
      .setTitle("🐹  Trade Complete!")
      .setDescription(`The hamsters have swapped homes!\n\n🐹 **${trade.offererName}** now has: **${offHams[trade.offererSlot].nickname}** (${offHams[trade.offererSlot].type})\n🐹 **${trade.targetName}** now has: **${tarHams[trade.targetSlot].nickname}** (${tarHams[trade.targetSlot].type})`)
      .setColor(0x2ecc71).setFooter({ text: "Use !hamster to visit your new companion!" }).setTimestamp()], components: [] });
  }
});
}

async function handleRename(msg) {
  const renameData = pendingHamsterRenames.get(msg.author.id);
  if (renameData && !msg.author.bot) {
    if (Date.now() > renameData.expiresAt) {
      pendingHamsterRenames.delete(msg.author.id);
    } else if (!msg.content.startsWith(PREFIX)) {
      pendingHamsterRenames.delete(msg.author.id);
      const newName = msg.content.trim();
      if (newName.toLowerCase() === "cancel") {
        await msg.reply("❌ Rename cancelled.");
      } else if (newName.length > 20) {
        await msg.reply("❌ Name must be 20 characters or fewer! Rename cancelled.");
      } else {
        ensureUser(msg.author.id, msg.member?.displayName ?? msg.author.username);
        const hams = getHamsters(msg.author.id);
        if (hams[renameData.slot]?.type === renameData.type) {
          db.users[msg.author.id].hamsters[renameData.slot].nickname = newName;
          saveData(db);
          await msg.reply(`✅ Renamed to **${newName}**! 🐹`);
        } else {
          await msg.reply("❌ Something changed — rename cancelled.");
        }
      }
      return true;
    }
  }
  return false;
}

module.exports = function hamsterInit(deps) {
  ({ db, saveData, addKittens, removeKittens, getKittens, ensureUser, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PREFIX, client } = deps);
  return { hamHandleCommand, registerInteractions, handleRename };
};
