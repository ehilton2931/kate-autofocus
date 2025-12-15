// Internal Settings //===================================================//
// This system used to be a lot more customizable, but due to technical
// limitations most of it has been removed. The options remain to make a
// potential future reimplementation easier.

let modeA = {
	enabled: true,
	priorityOrder: "stack",
	requireSameActivity: true,
	requireSameWorkspace: true,
	monitorBehavior: "ignore"
};

// priorityOrder would have been used to use the last focused window even if
// a Kate window was marked with Keep Above Others. However, it was deemed
// that the feature was not worth the time required to implement it.

// modeB would have been used to give Kate focus on any focus switch (then
// switch back to the intended window). This would have enabled better
// support for multi-monitor setups. Unfortunately, instantaneous focus
// switching did not work, and delayed focus switching caused too many
// deadlocks. Additionally, modeA and modeB would sometimes conflict with
// one another. For these reasons modeB was removed.

// Debug //===============================================================//
let debug = false;
function debugPrint(...args) {
	if (debug) print("KateAutofocus:", ...args);
}

// Utilities //===========================================================//
function isWindowValid(clientWindow) {
	debugPrint("isWindowValid called.");
	
	if (!clientWindow) return false;
	if (!clientWindow.normalWindow) return false;
	
	return true;
}
function isWindowKateInstance(clientWindow) {
	debugPrint("isWindowKateInstance called.");
	
	if (clientWindow.resourceClass === "kate") return true;
	if (clientWindow.resourceClass === "org.kde.kate") return true;
	if (clientWindow.resourceName === "kate") return true;
	if (clientWindow.resourceName === "org.kde.kate") return true;
	
	return false;
}
function isWindowOnActivity(clientWindow, activity) {
	debugPrint("isWindowOnActivity called.");
	
	if (clientWindow.activities.length === 0) return true; // Window is on all activities
	if (typeof activity === "undefined") return false;
	if (clientWindow.activities.includes(activity)) return true;
	
	return false;
}
function isWindowOnWorkspace(clientWindow, workspace) {
	debugPrint("isWindowOnWorkspace called.");
	
	if (clientWindow.onAllDesktops) return true;
	if (clientWindow.desktops.length === 0) return true; // Window is on all workspaces
	if (typeof workspace === "undefined") return false;
	if (clientWindow.desktops.includes(workspace)) return true;
	
	return false;
}
function isWindowOnMonitor(clientWindow, monitor) {
	debugPrint("isWindowOnMonitor called.");
	
	if (typeof monitor === "undefined") return false;
	if (clientWindow.output === monitor) return true;
	
	return false;
}
function getClientList(priorityOrder) {
	debugPrint("getClientList called.");
	// NOTE: ended up never introducing this functionality.
	// It would drastically increase code complexity in exchange for *potentially* improving a corner case.
	return workspace.stackingOrder;
}

// Core //================================================================//
function givePriority(kateInstance) {
	debugPrint("givePriority called.");
	workspace.activeWindow = kateInstance;
	debugPrint("givePriority finished.");
}
function prioritizeKate(activity, workspace, monitor, mode) {
	debugPrint("prioritizeKate called.");
	if (!mode.enabled) {
		debugPrint("Mode not enabled. Exiting prioritizeKate.");
		return false;
	}
	
	let kateToPrioritize = undefined;
	const clientList = getClientList(mode.priorityOrder);
	
	
	
	for (let index = clientList.length - 1; index >= 0; index--) {
		const clientWindow = clientList[index];
		if (!isWindowValid(clientWindow)) continue;
		if (!isWindowKateInstance(clientWindow)) continue;
		
		if (mode.requireSameActivity && !isWindowOnActivity(clientWindow, activity)) continue;
		if (mode.requireSameWorkspace && !isWindowOnWorkspace(clientWindow, workspace)) continue;
		
		if (!isWindowOnMonitor(clientWindow, monitor)) {
			if (mode.monitorBehavior === "require") continue;
			if (mode.monitorBehavior === "prefer" && typeof kateToPrioritize === "undefined") {
				debugPrint("Found Kate on wrong monitor. Noting and continuing.");
				kateToPrioritize = clientWindow;
				continue;
			}
		}
		
		debugPrint("Found Kate matching all criteria.");
		kateToPrioritize = clientWindow;
		break;
	}
	
	
	
	if (typeof kateToPrioritize === "undefined") {
		debugPrint("Did not find Kate. Exiting prioritizeKate.");
		return false;
	}
	
	debugPrint("Giving priority to Kate.");
	givePriority(kateToPrioritize);
	debugPrint("prioritizeKate finished.");
	return true;
}

// Mode A Hooks //========================================================//
function mainModeA() {
	debugPrint("mainModeA called.");
	
	let monitor = workspace.screenAt(workspace.cursorPos);
	//if (modeATrigger.effectiveMonitor === "active-window") monitor = workspace.activeSceen;
	prioritizeKate(
		workspace.currentActivity, workspace.currentDesktop, monitor,
		modeA
	);
	
	debugPrint("mainModeA finished.");
}
function onActivitySwitch(ignored) {
	debugPrint("onActivitySwitch called.");
	/*if (!modeATrigger.onActivitySwitch) {
		debugPrint("Trigger disabled. Exiting onActivitySwitch.");
		return;
	}*/
	
	mainModeA();
	debugPrint("onActivitySwitch finished.");
}
function onWorkspaceSwitch(ignored) {
	debugPrint("onWorkspaceSwitch called.");
	/*if (!modeATrigger.onWorkspaceSwitch) {
		debugPrint("Trigger disabled. Exiting onWorkspaceSwitch.");
		return;
	}*/
	
	mainModeA();
	debugPrint("onWorkspaceSwitch finished.");
}
workspace.currentActivityChanged.connect(onActivitySwitch);
workspace.currentDesktopChanged.connect(onWorkspaceSwitch);
