if (typeof links === 'undefined') {
    links = {};
    links.locales = {};
} else if (typeof links.locales === 'undefined') {
    links.locales = {};
}

// English ===================================================
links.locales['en'] = {
    'MONTHS': ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    'MONTHS_SHORT': ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    'DAYS': ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    'DAYS_SHORT': ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    'ZOOM_IN': "Zoom in",
    'ZOOM_OUT': "Zoom out",
    'MOVE_LEFT': "Move left",
    'MOVE_RIGHT': "Move right",
    'NEW': "New",
    'CREATE_NEW_EVENT': "Create new event"
};

links.locales['en_US'] = links.locales['en'];
links.locales['en_UK'] = links.locales['en'];

// French ===================================================
links.locales['fr'] = {
    'MONTHS': ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    'MONTHS_SHORT': ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"],
    'DAYS': ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    'DAYS_SHORT': ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    'ZOOM_IN': "Zoomer",
    'ZOOM_OUT': "Dézoomer",
    'MOVE_LEFT': "Déplacer à gauche",
    'MOVE_RIGHT': "Déplacer à droite",
    'NEW': "Nouveau",
    'CREATE_NEW_EVENT': "Créer un nouvel évènement"
};

links.locales['fr_FR'] = links.locales['fr'];
links.locales['fr_BE'] = links.locales['fr'];
links.locales['fr_CA'] = links.locales['fr'];

// Catalan ===================================================
links.locales['ca'] = {
    'MONTHS': ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Setembre", "Octubre", "Novembre", "Desembre"],
    'MONTHS_SHORT': ["Gen", "Feb", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Des"],
    'DAYS': ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"],
    'DAYS_SHORT': ["Dm.", "Dl.", "Dm.", "Dc.", "Dj.", "Dv.", "Ds."],
    'ZOOM_IN': "Augmentar zoom",
    'ZOOM_OUT': "Disminuir zoom",
    'MOVE_LEFT': "Moure esquerra",
    'MOVE_RIGHT': "Moure dreta",
    'NEW': "Nou",
    'CREATE_NEW_EVENT': "Crear nou event"
};
links.locales['ca_ES'] = links.locales['ca'];

// German ===================================================
links.locales['de'] = {
    'MONTHS': ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    'MONTHS_SHORT': ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    'DAYS': ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    'DAYS_SHORT': ["Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam"],
    'ZOOM_IN': "Vergrößern",
    'ZOOM_OUT': "Verkleinern",
    'MOVE_LEFT': "Nach links verschieben",
    'MOVE_RIGHT': "Nach rechts verschieben",
    'NEW': "Neu",
    'CREATE_NEW_EVENT': "Neues Ereignis erzeugen"
};

links.locales['de_DE'] = links.locales['de'];
links.locales['de_CH'] = links.locales['de'];

// Danish ===================================================
links.locales['da'] = {
    'MONTHS': ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"],
    'MONTHS_SHORT': ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
    'DAYS': ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"],
    'DAYS_SHORT': ["søn", "man", "tir", "ons", "tor", "fre", "lør"],
    'ZOOM_IN': "Zoom in",
    'ZOOM_OUT': "Zoom out",
    'MOVE_LEFT': "Move left",
    'MOVE_RIGHT': "Move right",
    'NEW': "New",
    'CREATE_NEW_EVENT': "Create new event"
};
links.locales['da_DK'] = links.locales['da'];

// Russian ===================================================
links.locales['ru'] = {
    'MONTHS': ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    'MONTHS_SHORT': ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    'DAYS': ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
    'DAYS_SHORT': ["Вос", "Пон", "Втo", "Срe", "Чет", "Пят", "Суб"],
    'ZOOM_IN': "Увeличить",
    'ZOOM_OUT': "Умeньшить",
    'MOVE_LEFT': "Сдвинуть налeво",
    'MOVE_RIGHT': "Сдвинуть направо",
    'NEW': "Новый",
    'CREATE_NEW_EVENT': "Создать новоe событиe"
};
links.locales['ru_RU'] = links.locales['ru'];

// Spanish ===================================================
links.locales['es'] = {
    'MONTHS': ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    'MONTHS_SHORT': ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    'DAYS': ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    'DAYS_SHORT': ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    'ZOOM_IN': "Aumentar zoom",
    'ZOOM_OUT': "Disminuir zoom",
    'MOVE_LEFT': "Mover izquierda",
    'MOVE_RIGHT': "Mover derecha",
    'NEW': "Nuevo",
    'CREATE_NEW_EVENT': "Crear nuevo evento"
};

links.locales['es_ES'] = links.locales['es'];

// Dutch =====================================================
links.locales['nl'] = {
    'MONTHS': ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
    'MONTHS_SHORT': ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
    'DAYS': ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
    'DAYS_SHORT': ["zo", "ma", "di", "wo", "do", "vr", "za"],
    'ZOOM_IN': "Inzoomen",
    'ZOOM_OUT': "Uitzoomen",
    'MOVE_LEFT': "Naar links",
    'MOVE_RIGHT': "Naar rechts",
    'NEW': "Nieuw",
    'CREATE_NEW_EVENT': "Nieuwe gebeurtenis maken"
};

links.locales['nl_NL'] = links.locales['nl'];
links.locales['nl_BE'] = links.locales['nl'];

// Turkish ===================================================
links.locales['tr'] = {
    'MONTHS': ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
    'MONTHS_SHORT': ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
    'DAYS': ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
    'DAYS_SHORT': ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
    'ZOOM_IN': "Büyült",
    'ZOOM_OUT': "Küçült",
    'MOVE_LEFT': "Sola Taşı",
    'MOVE_RIGHT': "Sağa Taşı",
    'NEW': "Yeni",
    'CREATE_NEW_EVENT': "Yeni etkinlik oluştur"
};

links.locales['tr_TR'] = links.locales['tr'];

// Hungarian ===================================================
links.locales['hu'] = {
    'MONTHS': ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"],
    'MONTHS_SHORT': ["jan", "feb", "márc", "ápr", "máj", "jún", "júl", "aug", "szep", "okt", "nov", "dec"],
    'DAYS': ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"],
    'DAYS_SHORT': ["vas", "hét", "kedd", "sze", "csü", "pé", "szo"],
    'ZOOM_IN': "Nagyítás",
    'ZOOM_OUT': "Kicsinyítés",
    'MOVE_LEFT': "Balra",
    'MOVE_RIGHT': "Jobbra",
    'NEW': "Új",
    'CREATE_NEW_EVENT': "Új esemény készítése"
};

links.locales['hu_HU'] = links.locales['hu'];