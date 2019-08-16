export function input(message) {
  return new Promise((resolve, reject) => {
    $ui.push({
      type: "view",
      props: {
        id: "input-element"
      },
      layout: (make, view) => {
        make.height.equalTo(view.super.width);
        make.width.equalTo(view.super.width);
        make.top.equalTo(0);
      },
      views: [
        {
          type: "input",
          id: "code",
          props: {
            textColor: $color("#000000"),
            bgcolor: $color("#D1D3D9"),
            radius: 10,
            align: $align.center
          },
          layout: (make, view) => {
            make.width.equalTo(view.super).multipliedBy(0.7);
            make.height.equalTo(35);
            make.centerY.equalTo(view.super);
            make.centerX.equalTo(view.super);
          },
          events: {
            returned: sender => {
              $ui.pop();
              resolve(sender.text);
            },
          }
        },
        {
          type: "label",
          props: {
            textColor: $color("black"),
            text: message,
            align: $align.center
          },
          layout: (make, view) => {
            make.centerX.equalTo(view.super);
            make.centerY.equalTo(view.super).offset(-40);
          },
          events: {}
        }
      ]
    });
  });
}
