$(document).ready(function(){
  var link = $('#qrcode_link').attr('value')
  var qrcode = new QRCode("qrcode", {
      text: link,
      width: 200,
      height: 200,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
  });
  // var qrcode = new QRCode("qrcode");
  //
  // function makeCode () {
  //   var elText = document.getElementById("text");
  //
  //   if (!elText.value) {
  //     alert("Input a text");
  //     elText.focus();
  //     return;
  //   }
  //
  //   qrcode.makeCode(elText.value);
  // }

  makeCode();
  $("#karta_przewozowa").on('click', (function(){
    // Choose the element that our invoice is rendered in
    const element = document.getElementById("#karta_przewozowa");
    // Choose the element and save the PDF for our user.
    html2pdf()
    .from(element)
    .save();
  }))
})
