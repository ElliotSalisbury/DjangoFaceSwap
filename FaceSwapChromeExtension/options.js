// Saves options to chrome.storage.sync.
function save_options() {
	var onoff = document.getElementById('onoff').checked;
	var percentage = document.getElementById('percentage').value / document.getElementById('percentage').max;
	chrome.storage.sync.set({
		onoff: onoff,
		percentage: percentage
	}, function() {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');
		status.textContent = 'Options saved.';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
	// Use default value color = 'red' and likesColor = true.
	chrome.storage.sync.get({
		onoff: true,
		percentage: 0.9

	}, function(items) {
		document.getElementById('onoff').checked = items.onoff;
		document.getElementById('percentage').value = Math.floor(items.percentage * document.getElementById('percentage').max);
	});
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
	save_options);