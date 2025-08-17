// Script to clear authentication state and reset the app
// Run this in browser console to fix logout issues

console.log('🔧 Clearing authentication state...')

// Clear all localStorage
console.log('📝 Clearing localStorage...')
localStorage.clear()

// Clear all sessionStorage  
console.log('📝 Clearing sessionStorage...')
sessionStorage.clear()

// Clear IndexedDB (Supabase auth storage)
console.log('📝 Clearing IndexedDB...')
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name) {
        console.log(`Deleting database: ${db.name}`)
        indexedDB.deleteDatabase(db.name)
      }
    })
  }).catch(err => {
    console.log('IndexedDB clear failed:', err)
  })
}

// Clear cookies for the domain
console.log('📝 Clearing cookies...')
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
})

// Clear any Supabase specific storage
console.log('📝 Clearing Supabase storage...')
const supabaseKeys = []
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  if (key && (key.includes('supabase') || key.includes('sb-'))) {
    supabaseKeys.push(key)
  }
}
supabaseKeys.forEach(key => localStorage.removeItem(key))

console.log('✅ Authentication state cleared!')
console.log('🔄 Please refresh the page to complete the reset.')
console.log('💡 After refresh, you should see the login screen.')

// Auto-refresh after a short delay
setTimeout(() => {
  console.log('🔄 Auto-refreshing page...')
  window.location.reload()
}, 2000)
