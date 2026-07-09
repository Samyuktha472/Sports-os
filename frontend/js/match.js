await fetch(`${API_BASE_URL}/matches`,{
    method:"POST",
    headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
    },
    body:JSON.stringify({
        title,
        opponent,
        date,
        time,
        venue,
        batch,
        notes
    })
});