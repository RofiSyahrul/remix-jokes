const specialChar = 'àáäâãåèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;';
const normalChar = 'aaaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------';
const specialCharRegExp = new RegExp(specialChar.split('').join('|'), 'g');

export default function slugify(source: string) {
  return source
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(specialCharRegExp, (char) => normalChar.charAt(specialChar.indexOf(char)))
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word characters such as spaces or tabs
    .replace(/--+/g, '-') // Replace multiple — with single -
    .replace(/^-+/, '') // Trim — from start of text
    .replace(/-+$/, ''); // Trim — from end of text
}
