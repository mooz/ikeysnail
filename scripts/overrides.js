exports.register = () => {
  return;
  exports.unregister();
  /*
      $define({
        type: "WKWebView",
        events: {
          "canPerformAction:withSender:": (action, sender) => {
            const selector = action.jsValue();
            const whiteList = ["_lookup:", "_share:"];
            if (selector.startsWith("_") && whiteList.indexOf(selector) === -1) {
              return false;
            }
            return self.$ORIGcanPerformAction_withSender(action, sender);
          }
        }
      }); */

  $define({
    type: "WKContentView",
    events: {
      /* 
      "_singleTapRecognized:": gesture => {
        console.log("Tapped!!!!");
        console.log(gesture.rawValue());
        return self.$ORIG_singleTapRecognized(gesture);
      },
      */
      "_elementDidFocus:userIsInteracting:blurPreviousNode:activityStateChanges:userObject:": (
        info,
        userIsInteracting,
        blurPreviousNode,
        activityStateChanges,
        userData
      ) => {
        // WebCore::ActivityState::IsFocused

        let val = self.$ORIG_elementDidFocus(
          info,
          false,
          false,
          false,
          userData
        );

        console.log(activityStateChanges);
      }
    }
  });
};

exports.unregister = () => {
  const core = $objc("RedBoxCore");
  core.$cleanClass("WKContentView");
};
