
'use strict';

module.exports = addFields => addFields({
	termSeason: (item) => item.cla_term_name[0]
});

